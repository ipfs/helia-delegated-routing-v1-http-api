import { CodeError } from '@libp2p/interface/errors'
import { logger } from '@libp2p/logger'
import { peerIdFromString } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { anySignal } from 'any-signal'
import toIt from 'browser-readablestream-to-it'
// @ts-expect-error no types
import ndjson from 'iterable-ndjson'
import defer from 'p-defer'
import PQueue from 'p-queue'
import type { RoutingV1HttpApiClient, RoutingV1HttpApiClientInit } from './index.js'
import type { AbortOptions } from '@libp2p/interface'
import type { PeerInfo } from '@libp2p/interface/peer-info'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { CID } from 'multiformats'

const log = logger('routing-v1-http-api-client')

interface RoutingV1HttpApiGetProvidersResponse {
  Protocol: string
  Schema: string
  ID: string
  Addrs: Multiaddr[]
}

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

  async * getProviders (cid: CID, options: AbortOptions | undefined = {}): AsyncGenerator<PeerInfo, any, unknown> {
    log('findProviders starts: %c', cid)

    const signal = anySignal([this.shutDownController.signal, options.signal, AbortSignal.timeout(this.timeout)])
    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return onFinish.promise
    })

    try {
      await onStart.promise

      // https://github.com/ipfs/specs/blob/main/routing/ROUTING_V1_HTTP.md#api
      const resource = `${this.clientUrl}routing/v1/providers/${cid.toString()}`
      const getOptions = { headers: { Accept: 'application/x-ndjson' }, signal }
      const a = await fetch(resource, getOptions)

      if (a.body == null) {
        throw new CodeError('Routing response had no body', 'ERR_BAD_RESPONSE')
      }

      for await (const event of ndjson(toIt(a.body))) {
        if (event.Protocol !== 'transport-bitswap') {
          continue
        }

        yield this.#mapProvider(event)
      }
    } catch (err) {
      log.error('findProviders errored:', err)
    } finally {
      signal.clear()
      onFinish.resolve()
      log('findProviders finished: %c', cid)
    }
  }

  #mapProvider (event: RoutingV1HttpApiGetProvidersResponse): PeerInfo {
    const peer = peerIdFromString(event.ID)
    const ma: Multiaddr[] = []

    for (const strAddr of event.Addrs) {
      const addr = multiaddr(strAddr)
      ma.push(addr)
    }

    const pi = {
      id: peer,
      multiaddrs: ma,
      protocols: []
    }

    return pi
  }
}
