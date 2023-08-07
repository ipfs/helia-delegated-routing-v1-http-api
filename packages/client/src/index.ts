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
import type { PeerInfo } from '@libp2p/interface-peer-info'
import type { AbortOptions } from '@libp2p/interfaces'
import type { CID } from 'multiformats/cid'

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
  getProviders: (cid: CID, options?: AbortOptions) => AsyncGenerator<PeerInfo>

  /**
   * Shut down any currently running HTTP requests and clear up any resources
   * that are in use
   */
  stop: () => void
}

/**
 * Create and return a client to use with a Routing V1 HTTP API server
 */
export function createRoutingV1HttpApiClient (url: URL, init: RoutingV1HttpApiClientInit = {}): RoutingV1HttpApiClient {
  return new DefaultRoutingV1HttpApiClient(url, init)
}
