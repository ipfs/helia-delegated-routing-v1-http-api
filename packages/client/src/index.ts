/**
 * @packageDocumentation
 *
 * A client implementation of the IPFS [Delegated Routing V1 HTTP API](https://specs.ipfs.tech/routing/http-routing-v1/)
 * that can be used to interact with any compliant server implementation.
 *
 * @example
 *
 * ```typescript
 * import { createDelegatedRoutingV1HttpApiClient } from '@helia/routing-v1-http-api-client'
 * import { CID } from 'multiformats/cid'
 *
 * const client = createDelegatedRoutingV1HttpApiClient('https://example.org')
 *
 * for await (const prov of getProviders(CID.parse('QmFoo'))) {
 *   // ...
 * }
 * ```
 *
 * ## How to use with libp2p
 *
 * The client can be configured as a libp2p service, this will enable it as both
 * a {@link https://libp2p.github.io/js-libp2p/interfaces/_libp2p_interface.content_routing.ContentRouting.html | ContentRouting}
 * and a {@link https://libp2p.github.io/js-libp2p/interfaces/_libp2p_interface.peer_routing.PeerRouting.html | PeerRouting}
 * implementation
 *
 * @example
 *
 * ```typescript
 * import { createDelegatedRoutingV1HttpApiClient } from '@helia/routing-v1-http-api-client'
 * import { createLibp2p } from 'libp2p'
 *
 * const client = createDelegatedRoutingV1HttpApiClient('https://example.org')
 * const libp2p = await createLibp2p({
 *   // other config here
 *   services: {
 *     delegatedRouting: client
 *   }
 * })
 *
 * // later this will use the configured HTTP gateway
 * await libp2p.peerRouting.findPeer(peerId, options)
 * ```
 */

import { DefaultDelegatedRoutingV1HttpApiClient } from './client.js'
import type { AbortOptions } from '@libp2p/interface'
import type { PeerId } from '@libp2p/interface/peer-id'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { IPNSRecord } from 'ipns'
import type { CID } from 'multiformats/cid'

export interface PeerRecord {
  Schema: 'peer'
  ID: PeerId
  Addrs: Multiaddr[]
  Protocols: string[]
}

export interface DelegatedRoutingV1HttpApiClientInit {
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

export interface DelegatedRoutingV1HttpApiClient {
  /**
   * Returns an async generator of {@link PeerRecord}s that can provide the
   * content for the passed {@link CID}
   */
  getProviders(cid: CID, options?: AbortOptions): AsyncGenerator<PeerRecord>

  /**
   * Returns an async generator of {@link PeerRecord}s for the provided
   * {@link PeerId}
   */
  getPeers(peerId: PeerId, options?: AbortOptions): AsyncGenerator<PeerRecord>

  /**
   * Returns a promise of a {@link IPNSRecord} for the given {@link PeerId}
   */
  getIPNS(peerId: PeerId, options?: AbortOptions): Promise<IPNSRecord>

  /**
   * Publishes the given {@link IPNSRecord} for the provided {@link PeerId}
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
export function createDelegatedRoutingV1HttpApiClient (url: URL | string, init: DelegatedRoutingV1HttpApiClientInit = {}): DelegatedRoutingV1HttpApiClient {
  return new DefaultDelegatedRoutingV1HttpApiClient(new URL(url), init)
}
