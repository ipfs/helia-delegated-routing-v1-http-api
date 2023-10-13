import { CodeError } from '@libp2p/interface/errors'
import { logger } from '@libp2p/logger'
import { peerIdFromString } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { anySignal } from 'any-signal'
import toIt from 'browser-readablestream-to-it'
import { unmarshal, type IPNSRecord, marshal } from 'ipns'
import toBuffer from 'it-to-buffer'
// @ts-expect-error no types
import ndjson from 'iterable-ndjson'
import defer from 'p-defer'
import PQueue from 'p-queue'
import type { RoutingV1HttpApiClient, RoutingV1HttpApiClientInit, Record, PeerRecord } from './index.js'
import type { AbortOptions } from '@libp2p/interface'
import type { PeerId } from '@libp2p/interface/peer-id'
import type { CID } from 'multiformats'

const log = logger('routing-v1-http-api-client')

const defaultValues = {
  concurrentRequests: 4,
  timeout: 30e3
}

export class DefaultRoutingV1HttpApiClient implements RoutingV1HttpApiClient {
  private started: boolean
  private readonly httpQueue: PQueue
  private readonly shutDownController: AbortController
  private readonly clientUrl: URL
  private readonly timeout: number

  /**
   * Create a new DelegatedContentRouting instance
   */
  constructor (url: string | URL, init: RoutingV1HttpApiClientInit = {}) {
    this.started = false
    this.shutDownController = new AbortController()
    this.httpQueue = new PQueue({
      concurrency: init.concurrentRequests ?? defaultValues.concurrentRequests
    })
    this.clientUrl = url instanceof URL ? url : new URL(url)
    this.timeout = init.timeout ?? defaultValues.timeout
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

  async * getProviders (cid: CID, options: AbortOptions = {}): AsyncGenerator<Record, any, unknown> {
    log('getProviders starts: %c', cid)

    const signal = anySignal([this.shutDownController.signal, options.signal, AbortSignal.timeout(this.timeout)])
    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return onFinish.promise
    })

    try {
      await onStart.promise

      // https://specs.ipfs.tech/routing/http-routing-v1/
      const resource = `${this.clientUrl}routing/v1/providers/${cid.toString()}`
      const getOptions = { headers: { Accept: 'application/x-ndjson' }, signal }
      const a = await fetch(resource, getOptions)

      if (a.body == null) {
        throw new CodeError('Routing response had no body', 'ERR_BAD_RESPONSE')
      }

      const contentType = a.headers.get('Content-Type')
      if (contentType === 'application/json') {
        const body = await a.json()

        for (const provider of body.Providers) {
          const record = this.#handleProviderRecords(provider)
          if (record !== null) {
            yield record
          }
        }
      } else {
        for await (const provider of ndjson(toIt(a.body))) {
          const record = this.#handleProviderRecords(provider)
          if (record !== null) {
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

  async * getPeerInfo (peerId: PeerId, options: AbortOptions | undefined = {}): AsyncGenerator<PeerRecord, any, unknown> {
    log('getPeers starts: %c', peerId)

    const signal = anySignal([this.shutDownController.signal, options.signal, AbortSignal.timeout(this.timeout)])
    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return onFinish.promise
    })

    try {
      await onStart.promise

      // https://specs.ipfs.tech/routing/http-routing-v1/
      const resource = `${this.clientUrl}routing/v1/peers/${peerId.toCID().toString()}`
      const getOptions = { headers: { Accept: 'application/x-ndjson' }, signal }
      const a = await fetch(resource, getOptions)

      if (a.body == null) {
        throw new CodeError('Routing response had no body', 'ERR_BAD_RESPONSE')
      }

      const contentType = a.headers.get('Content-Type')
      if (contentType === 'application/json') {
        const body = await a.json()

        for (const peer of body.Peers) {
          const record = this.#handlePeerRecords(peer)
          if (record !== null) {
            yield record
          }
        }
      } else {
        for await (const peer of ndjson(toIt(a.body))) {
          const record = this.#handlePeerRecords(peer)
          if (record !== null) {
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

  async getIPNS (peerId: PeerId, options: AbortOptions = {}): Promise<IPNSRecord> {
    log('getIPNS starts: %c', peerId)

    const signal = anySignal([this.shutDownController.signal, options.signal, AbortSignal.timeout(this.timeout)])
    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return onFinish.promise
    })

    try {
      await onStart.promise

      // https://specs.ipfs.tech/routing/http-routing-v1/
      const resource = `${this.clientUrl}routing/v1/ipns/${peerId.toCID().toString()}`
      const getOptions = { headers: { Accept: 'application/vnd.ipfs.ipns-record' }, signal }
      const a = await fetch(resource, getOptions)

      if (a.body == null) {
        throw new CodeError('GET ipns response had no body', 'ERR_BAD_RESPONSE')
      }

      const body = await toBuffer(toIt(a.body))
      return unmarshal(body)
    } finally {
      signal.clear()
      onFinish.resolve()
      log('getIPNS finished: %c', peerId)
    }
  }

  async putIPNS (peerId: PeerId, record: IPNSRecord, options: AbortOptions = {}): Promise<void> {
    log('getIPNS starts: %c', peerId)

    const signal = anySignal([this.shutDownController.signal, options.signal, AbortSignal.timeout(this.timeout)])
    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return onFinish.promise
    })

    try {
      await onStart.promise

      const body = marshal(record)

      // https://specs.ipfs.tech/routing/http-routing-v1/
      const resource = `${this.clientUrl}routing/v1/ipns/${peerId.toCID().toString()}`
      const getOptions = { method: 'PUT', headers: { 'Content-Type': 'application/vnd.ipfs.ipns-record' }, body, signal }
      const res = await fetch(resource, getOptions)
      if (res.status !== 200) {
        throw new CodeError('PUT ipns response had status other than 200', 'ERR_BAD_RESPONSE')
      }
    } finally {
      signal.clear()
      onFinish.resolve()
      log('getIPNS finished: %c', peerId)
    }
  }

  #handleProviderRecords (record: any): Record | null {
    if (record.Schema === 'peer') {
      // Peer schema can have additional, user-defined, fields.
      record.ID = peerIdFromString(record.ID)
      record.Addrs = record.Addrs.map(multiaddr)
      return record
    } else if (record.Schema === 'bitswap') {
      // Bitswap schema cannot have additional fields.
      return {
        Schema: record.Schema,
        Protocol: record.Protocol,
        ID: peerIdFromString(record.ID),
        Addrs: record.Addrs.map(multiaddr)
      }
    }

    return null
  }

  #handlePeerRecords (record: any): PeerRecord | null {
    if (record.Schema === 'peer') {
      // Peer schema can have additional, user-defined, fields.
      record.ID = peerIdFromString(record.ID)
      record.Addrs = record.Addrs.map(multiaddr)
      return record
    }

    return null
  }
}
