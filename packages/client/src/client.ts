import { NotFoundError, contentRoutingSymbol, peerRoutingSymbol, setMaxListeners } from '@libp2p/interface'
import { logger } from '@libp2p/logger'
import { peerIdFromString } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { anySignal } from 'any-signal'
import toIt from 'browser-readablestream-to-it'
import { unmarshalIPNSRecord, type IPNSRecord, marshalIPNSRecord, multihashToIPNSRoutingKey } from 'ipns'
import { ipnsValidator } from 'ipns/validator'
import { parse as ndjson } from 'it-ndjson'
import defer from 'p-defer'
import PQueue from 'p-queue'
import { BadResponseError, InvalidRequestError } from './errors.js'
import { DelegatedRoutingV1HttpApiClientContentRouting, DelegatedRoutingV1HttpApiClientPeerRouting } from './routings.js'
import type { DelegatedRoutingV1HttpApiClient, DelegatedRoutingV1HttpApiClientInit, GetProvidersOptions, GetPeersOptions, GetIPNSOptions, PeerRecord } from './index.js'
import type { ContentRouting, PeerRouting, AbortOptions, PeerId } from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { CID } from 'multiformats'

const log = logger('delegated-routing-v1-http-api-client')

const defaultValues = {
  concurrentRequests: 4,
  timeout: 30e3
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
    this.clientUrl = url instanceof URL ? url : new URL(url)
    this.timeout = init.timeout ?? defaultValues.timeout
    this.filterAddrs = init.filterAddrs
    this.filterProtocols = init.filterProtocols
    this.contentRouting = new DelegatedRoutingV1HttpApiClientContentRouting(this)
    this.peerRouting = new DelegatedRoutingV1HttpApiClientPeerRouting(this)
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

  start (): void {
    this.started = true
  }

  stop (): void {
    this.httpQueue.clear()
    this.shutDownController.abort()
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
      const res = await fetch(url, getOptions)

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
        throw new BadResponseError('Routing response had no body')
      }

      const contentType = res.headers.get('Content-Type')
      if (contentType === 'application/json') {
        const body = await res.json()

        for (const provider of body.Providers) {
          const record = this.#conformToPeerSchema(provider)
          if (record != null) {
            yield record
          }
        }
      } else {
        for await (const provider of ndjson(toIt(res.body))) {
          const record = this.#conformToPeerSchema(provider)
          if (record != null) {
            yield record
          }
        }
      }
    } catch (err) {
      log.error('getProviders errored:', err)
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
      const res = await fetch(url, getOptions)

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
      const res = await fetch(resource, getOptions)

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
      const res = await fetch(resource, getOptions)

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
}
