/**
 * @packageDocumentation
 *
 * Create a Helia node.
 *
 * @example
 *
 * ```typescript
 * import { MemoryDatastore } from 'datastore-core'
 * import { MemoryBlockstore } from 'blockstore-core'
 * import { createHelia } from 'helia'
 * import { unixfs } from '@helia/unixfs'
 * import { CID } from 'multiformats/cid'
 *
 * const node = await createHelia({
 *   blockstore: new MemoryBlockstore(),
 *   datastore: new MemoryDatastore()
 * })
 * const fs = unixfs(node)
 * fs.cat(CID.parse('bafyFoo'))
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
  getProviders: (cid: CID, options?: AbortOptions) => AsyncGenerator<PeerInfo>
  stop: () => void
}

/**
 * Create and return a Helia node
 */
export function createRoutingV1HttpApiClient (url: URL, init: RoutingV1HttpApiClientInit = {}): RoutingV1HttpApiClient {
  return new DefaultRoutingV1HttpApiClient(url, init)
}
