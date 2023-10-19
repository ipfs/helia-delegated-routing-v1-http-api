/**
 * @packageDocumentation
 *
 * Create a client to use with a Routing V1 HTTP API server.
 *
 * @example
 *
 * ```typescript
 * import { createRoutingV1HttpApiClient } from '@helia/routing-v1-http-api-client'
 * import { CID } from 'multiformats/cid'
 *
 * const client = createRoutingV1HttpApiClient(new URL('https://example.org'))
 *
 * for await (const prov of getProviders(CID.parse('QmFoo'))) {
 *   // ...
 * }
 * ```
 */

import { DefaultRoutingV1HttpApiClient } from './client.js'
import type { AbortOptions } from '@libp2p/interface'
import type { PeerId } from '@libp2p/interface/peer-id'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { IPNSRecord } from 'ipns'
import type { CID } from 'multiformats/cid'

export interface PeerRecord {
  Schema: 'peer'
  ID: PeerId
  Addrs?: Multiaddr[]
  Protocols?: string[]
}

export interface BitswapRecord {
  Schema: 'bitswap'
  Protocol: string
  ID: PeerId
  Addrs: Multiaddr[]
}

export type Record = PeerRecord | BitswapRecord

export interface RoutingV1HttpApiClientInit {
  /**
   * A concurrency limit to avoid request flood in web browser (default: 4)
   *
   * @see https://github.com/libp2p/js-libp2p-delegated-content-routing/issues/12
   */
  concurrentRequests?: number

  /**
   * How long a request is allowed to take in ms (default: 30 seconds)
   */
  timeout?: number
}

export interface RoutingV1HttpApiClient {
  /**
   * Returns an async generator of PeerInfos that can provide the content
   * for the passed CID
   */
  getProviders(cid: CID, options?: AbortOptions): AsyncGenerator<Record>

  /**
   * Returns an async generator of PeerInfos for the provided PeerId
   */
  getPeerInfo(peerId: PeerId, options?: AbortOptions): AsyncGenerator<PeerRecord>

  /**
   * Returns a promise of a IPNSRecord for the given PeerId
   */
  getIPNS(peerId: PeerId, options?: AbortOptions): Promise<IPNSRecord>

  /**
   * Publishes the given IPNSRecorded for the provided PeerId
   */
  putIPNS(peerId: PeerId, record: IPNSRecord, options?: AbortOptions): Promise<void>

  /**
   * Shut down any currently running HTTP requests and clear up any resources
   * that are in use
   */
  stop(): void
}

/**
 * Create and return a client to use with a Routing V1 HTTP API server
 */
export function createRoutingV1HttpApiClient (url: URL, init: RoutingV1HttpApiClientInit = {}): RoutingV1HttpApiClient {
  return new DefaultRoutingV1HttpApiClient(url, init)
}
