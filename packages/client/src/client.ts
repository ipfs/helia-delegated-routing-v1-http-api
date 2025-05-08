import { NotFoundError, contentRoutingSymbol, peerRoutingSymbol, setMaxListeners } from '@libp2p/interface'
import { logger } from '@libp2p/logger'
import { peerIdFromString } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { anySignal } from 'any-signal'
import toIt from 'browser-readablestream-to-it'
import { unmarshalIPNSRecord, marshalIPNSRecord, multihashToIPNSRoutingKey } from 'ipns'
import { ipnsValidator } from 'ipns/validator'
import { parse as ndjson } from 'it-ndjson'
import defer from 'p-defer'
import PQueue from 'p-queue'
import { BadResponseError, InvalidRequestError } from './errors.js'
import { DelegatedRoutingV1HttpApiClientContentRouting, DelegatedRoutingV1HttpApiClientPeerRouting } from './routings.js'
import type { DelegatedRoutingV1HttpApiClient, DelegatedRoutingV1HttpApiClientInit, GetProvidersOptions, GetPeersOptions, GetIPNSOptions, PeerRecord } from './index.js'
import type { ContentRouting, PeerRouting, AbortOptions, PeerId } from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { IPNSRecord } from 'ipns'
import type { CID } from 'multiformats'

const log = logger('delegated-routing-v1-http-api-client')

const defaultValues = {
  concurrentRequests: 4,
  timeout: 30e3,
  cacheTTL: 5 * 60 * 1000, // 5 minutes default as per https://specs.ipfs.tech/routing/http-routing-v1/#response-headers
  cacheName: 'delegated-routing-v1-cache'
}

export class DefaultDelegatedRoutingV1HttpApiClient implements DelegatedRoutingV1HttpApiClient {
  private started: boolean
  private readonly httpQueue: PQueue
  private readonly shutDownController: AbortController
  private readonly clientUrl: URL
  private readonly timeout: number
  private readonly contentRouting: ContentRouting
  private readonly peerRouting: PeerRouting
  private readonly filterAddrs?: string[]
  private readonly filterProtocols?: string[]
  private readonly inFlightRequests: Map<string, Promise<Response>>
  private readonly cacheName: string
  private cache?: Cache
  private readonly cacheTTL: number
  /**
   * Create a new DelegatedContentRouting instance
   */
  constructor (url: string | URL, init: DelegatedRoutingV1HttpApiClientInit = {}) {
    this.started = false
    this.shutDownController = new AbortController()
    setMaxListeners(Infinity, this.shutDownController.signal)
    this.httpQueue = new PQueue({
      concurrency: init.concurrentRequests ?? defaultValues.concurrentRequests
    })
    this.inFlightRequests = new Map() // Tracks in-flight requests to avoid duplicate requests
    this.clientUrl = url instanceof URL ? url : new URL(url)
    this.timeout = init.timeout ?? defaultValues.timeout
    this.filterAddrs = init.filterAddrs
    this.filterProtocols = init.filterProtocols
    this.contentRouting = new DelegatedRoutingV1HttpApiClientContentRouting(this)
    this.peerRouting = new DelegatedRoutingV1HttpApiClientPeerRouting(this)

    this.cacheName = init.cacheName ?? defaultValues.cacheName
    this.cacheTTL = init.cacheTTL ?? defaultValues.cacheTTL
  }

  get [contentRoutingSymbol] (): ContentRouting {
    return this.contentRouting
  }

  get [peerRoutingSymbol] (): PeerRouting {
    return this.peerRouting
  }

  isStarted (): boolean {
    return this.started
  }

  async start (): Promise<void> {
    if (this.started) {
      return
    }

    this.started = true

    if (this.cacheTTL > 0) {
      this.cache = await globalThis.caches?.open(this.cacheName)

      if (this.cache != null) {
        log('cache enabled with ttl %d', this.cacheTTL)
      }
    }
  }

  async stop (): Promise<void> {
    this.httpQueue.clear()
    this.shutDownController.abort()

    // Clear the cache when stopping
    await globalThis.caches?.delete(this.cacheName)

    this.started = false
  }

  async * getProviders (cid: CID, options: GetProvidersOptions = {}): AsyncGenerator<PeerRecord> {
    log('getProviders starts: %c', cid)

    const timeoutSignal = AbortSignal.timeout(this.timeout)
    const signal = anySignal([this.shutDownController.signal, timeoutSignal, options.signal])
    setMaxListeners(Infinity, timeoutSignal, signal)
    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return onFinish.promise
    })

    try {
      await onStart.promise

      // https://specs.ipfs.tech/routing/http-routing-v1/
      const url = new URL(`${this.clientUrl}routing/v1/providers/${cid.toString()}`)
      this.#addFilterParams(url, options.filterAddrs, options.filterProtocols)
      const getOptions = { headers: { Accept: 'application/x-ndjson' }, signal }
      const res = await this.#makeRequest(url.toString(), getOptions)

      if (res == null) {
        throw new BadResponseError('No response received')
      }
      if (!res.ok) {
        if (res.status === 404) {
        // https://specs.ipfs.tech/routing/http-routing-v1/#response-status-codes
        // 404 (Not Found): must be returned if no matching records are found
          throw new NotFoundError('No matching records found')
        }

        if (res.status === 422) {
        // https://specs.ipfs.tech/routing/http-routing-v1/#response-status-codes
        // 422 (Unprocessable Entity): request does not conform to schema or semantic constraints
          throw new InvalidRequestError('Request does not conform to schema or semantic constraints')
        }
        throw new BadResponseError(`Unexpected status code: ${res.status}`)
      }

      if (res.body == null) {
        throw new BadResponseError('Routing response had no body')
      }

      const contentType = res.headers.get('Content-Type')
      if (contentType == null) {
        throw new BadResponseError('No Content-Type header received')
      }

      if (contentType?.startsWith('application/json')) {
        const body = await res.json()

        for (const provider of body.Providers) {
          const record = this.#conformToPeerSchema(provider)
          if (record != null) {
            yield record
          }
        }
      } else if (contentType.includes('application/x-ndjson')) {
        for await (const provider of ndjson(toIt(res.body))) {
          const record = this.#conformToPeerSchema(provider)
          if (record != null) {
            yield record
          }
        }
      } else {
        throw new BadResponseError(`Unsupported Content-Type: ${contentType}`)
      }
    } finally {
      signal.clear()
      onFinish.resolve()
      log('getProviders finished: %c', cid)
    }
  }

  async * getPeers (peerId: PeerId, options: GetPeersOptions = {}): AsyncGenerator<PeerRecord> {
    log('getPeers starts: %c', peerId)

    const timeoutSignal = AbortSignal.timeout(this.timeout)
    const signal = anySignal([this.shutDownController.signal, timeoutSignal, options.signal])
    setMaxListeners(Infinity, timeoutSignal, signal)
    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return onFinish.promise
    })

    try {
      await onStart.promise

      // https://specs.ipfs.tech/routing/http-routing-v1/
      const url = new URL(`${this.clientUrl}routing/v1/peers/${peerId.toCID().toString()}`)
      this.#addFilterParams(url, options.filterAddrs, options.filterProtocols)

      const getOptions = { headers: { Accept: 'application/x-ndjson' }, signal }
      const res = await this.#makeRequest(url.toString(), getOptions)

      if (res.status === 404) {
        // https://specs.ipfs.tech/routing/http-routing-v1/#response-status-codes
        // 404 (Not Found): must be returned if no matching records are found.
        throw new NotFoundError('No matching records found')
      }

      if (res.status === 422) {
        // https://specs.ipfs.tech/routing/http-routing-v1/#response-status-codes
        // 422 (Unprocessable Entity): request does not conform to schema or semantic constraints
        throw new InvalidRequestError('Request does not conform to schema or semantic constraints')
      }

      if (res.body == null) {
        throw new BadResponseError('Routing response had no body')
      }

      const contentType = res.headers.get('Content-Type')
      if (contentType === 'application/json') {
        const body = await res.json()

        for (const peer of body.Peers) {
          const record = this.#conformToPeerSchema(peer)
          if (record != null) {
            yield record
          }
        }
      } else {
        for await (const peer of ndjson(toIt(res.body))) {
          const record = this.#conformToPeerSchema(peer)
          if (record != null) {
            yield record
          }
        }
      }
    } catch (err) {
      log.error('getPeers errored:', err)
    } finally {
      signal.clear()
      onFinish.resolve()
      log('getPeers finished: %c', peerId)
    }
  }

  async getIPNS (libp2pKey: CID<unknown, 0x72, 0x00 | 0x12, 1>, options: GetIPNSOptions = {}): Promise<IPNSRecord> {
    log('getIPNS starts: %s', libp2pKey)

    const timeoutSignal = AbortSignal.timeout(this.timeout)
    const signal = anySignal([this.shutDownController.signal, timeoutSignal, options.signal])
    setMaxListeners(Infinity, timeoutSignal, signal)
    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return onFinish.promise
    })

    // https://specs.ipfs.tech/routing/http-routing-v1/
    const resource = `${this.clientUrl}routing/v1/ipns/${libp2pKey}`

    try {
      await onStart.promise

      const getOptions = { headers: { Accept: 'application/vnd.ipfs.ipns-record' }, signal }
      const res = await this.#makeRequest(resource, getOptions)

      log('getIPNS GET %s %d', resource, res.status)

      if (res.status === 404) {
        // https://specs.ipfs.tech/routing/http-routing-v1/#response-status-codes
        // 404 (Not Found): must be returned if no matching records are found
        throw new NotFoundError('No matching records found')
      }

      if (res.status === 422) {
        // https://specs.ipfs.tech/routing/http-routing-v1/#response-status-codes
        // 422 (Unprocessable Entity): request does not conform to schema or semantic constraints
        throw new InvalidRequestError('Request does not conform to schema or semantic constraints')
      }

      if (res.body == null) {
        throw new BadResponseError('GET ipns response had no body')
      }

      const buf = await res.arrayBuffer()
      const body = new Uint8Array(buf, 0, buf.byteLength)

      if (options.validate !== false) {
        await ipnsValidator(multihashToIPNSRoutingKey(libp2pKey.multihash), body)
      }

      return unmarshalIPNSRecord(body)
    } catch (err: any) {
      log.error('getIPNS GET %s error:', resource, err)

      throw err
    } finally {
      signal.clear()
      onFinish.resolve()
      log('getIPNS finished: %s', libp2pKey)
    }
  }

  async putIPNS (libp2pKey: CID<unknown, 0x72, 0x00 | 0x12, 1>, record: IPNSRecord, options: AbortOptions = {}): Promise<void> {
    log('putIPNS starts: %c', libp2pKey)

    const timeoutSignal = AbortSignal.timeout(this.timeout)
    const signal = anySignal([this.shutDownController.signal, timeoutSignal, options.signal])
    setMaxListeners(Infinity, timeoutSignal, signal)
    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return onFinish.promise
    })

    // https://specs.ipfs.tech/routing/http-routing-v1/
    const resource = `${this.clientUrl}routing/v1/ipns/${libp2pKey}`

    try {
      await onStart.promise

      const body = marshalIPNSRecord(record)

      const getOptions = { method: 'PUT', headers: { 'Content-Type': 'application/vnd.ipfs.ipns-record' }, body, signal }
      const res = await this.#makeRequest(resource, getOptions)

      log('putIPNS PUT %s %d', resource, res.status)

      if (res.status !== 200) {
        throw new BadResponseError('PUT ipns response had status other than 200')
      }
    } catch (err: any) {
      log.error('putIPNS PUT %s error:', resource, err.stack)

      throw err
    } finally {
      signal.clear()
      onFinish.resolve()
      log('putIPNS finished: %c', libp2pKey)
    }
  }

  #conformToPeerSchema (record: any): PeerRecord | undefined {
    try {
      const protocols: string[] = []
      const multiaddrs: Multiaddr[] = record.Addrs?.map(multiaddr) ?? []

      if (record.Protocols != null) {
        protocols.push(...record.Protocols)
      }

      if (record.Protocol != null) {
        protocols.push(record.Protocol)
        delete record.Protocol
      }

      return {
        ...record,
        Schema: 'peer',
        ID: peerIdFromString(record.ID),
        Addrs: multiaddrs,
        Protocols: protocols
      }
    } catch (err) {
      log.error('could not conform record to peer schema', err)
    }
  }

  #addFilterParams (url: URL, filterAddrs?: string[], filterProtocols?: string[]): void {
    // IPIP-484 filtering. local options filter precedence over global filter
    if (filterAddrs != null || this.filterAddrs != null) {
      const adressFilter = filterAddrs?.join(',') ?? this.filterAddrs?.join(',') ?? ''
      if (adressFilter !== '') {
        url.searchParams.set('filter-addrs', adressFilter)
      }
    }
    if (filterProtocols != null || this.filterProtocols != null) {
      const protocolFilter = filterProtocols?.join(',') ?? this.filterProtocols?.join(',') ?? ''
      if (protocolFilter !== '') {
        url.searchParams.set('filter-protocols', protocolFilter)
      }
    }
  }

  /**
   * makeRequest has two features:
   * - Ensures only one concurrent request is made for the same URL
   * - Caches GET requests if the Cache API is available
   */
  async #makeRequest (url: string, options: RequestInit): Promise<Response> {
    const requestMethod = options.method ?? 'GET'
    const key = `${requestMethod}-${url}`

    // Only try to use cache for GET requests
    if (requestMethod === 'GET') {
      const cachedResponse = await this.cache?.match(url)
      if (cachedResponse != null) {
        // Check if the cached response has expired
        const expires = parseInt(cachedResponse.headers.get('x-cache-expires') ?? '0', 10)
        if (expires > Date.now()) {
          log('returning cached response for %s', key)
          return cachedResponse
        } else {
          // Remove expired response from cache
          await this.cache?.delete(url)
        }
      }
    }

    // Check if there's already an in-flight request for this URL
    const existingRequest = this.inFlightRequests.get(key)
    if (existingRequest != null) {
      const response = await existingRequest
      log('deduplicating outgoing request for %s', key)
      return response.clone()
    }

    // Create new request and track it
    const requestPromise = fetch(url, options).then(async response => {
      // Only cache successful GET requests
      if (this.cache != null && response.ok && requestMethod === 'GET') {
        const expires = Date.now() + this.cacheTTL
        const headers = new Headers(response.headers)
        headers.set('x-cache-expires', expires.toString())

        // Create a new response with expiration header
        const cachedResponse = new Response(response.clone().body, {
          status: response.status,
          statusText: response.statusText,
          headers
        })

        await this.cache.put(url, cachedResponse)
      }
      return response
    }).finally(() => {
      // Clean up the tracked request when it completes
      this.inFlightRequests.delete(key)
    })

    this.inFlightRequests.set(key, requestPromise)
    const response = await requestPromise
    return response
  }
}
