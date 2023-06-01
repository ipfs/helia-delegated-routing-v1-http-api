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

import fastify, { type FastifyHttpOptions, type FastifyHttpsOptions, type FastifyInstance } from 'fastify'
import routes from './routes/index.js'
import type { Helia } from '@helia/interface'
import type * as http from 'node:http'
import type * as https from 'node:https'

export interface ServerInit {
  port?: number
  fastify?: FastifyHttpOptions<http.Server> | FastifyHttpsOptions<https.Server>
}

/**
 * Create and return a Helia node
 */
export async function createRoutingV1HttpApiServer (helia: Helia, init: ServerInit = {}): Promise<FastifyInstance> {
  const server = fastify(init.fastify)

  routes(server, helia)

  await server.listen({ port: init.port ?? 0 })

  return server
}
