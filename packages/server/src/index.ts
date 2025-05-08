/**
 * @packageDocumentation
 *
 * Implements HTTP routes for a Fastify server that conform to the [Routing V1 HTTP API](https://specs.ipfs.tech/routing/http-routing-v1/).
 *
 * @example
 *
 * ```typescript
 * import { createHelia } from 'helia'
 * import { createDelegatedRoutingV1HttpApiServer } from '@helia/delegated-routing-v1-http-api-server'
 *
 * const helia = await createHelia()
 * const server = await createDelegatedRoutingV1HttpApiServer(helia, {
 *   listen: {
 *     // fastify listen options
 *   }
 * })
 *
 * // now make http requests
 * ```
 *
 * Alternatively if you have a Fastify instance already you can add routes to it.
 *
 * @example
 *
 * ```typescript
 * import fastify from 'fastify'
 * import cors from '@fastify/cors'
 * import { createHelia } from 'helia'
 * import routes from '@helia/routing-v1-http-api-server/routes'
 *
 * const server = fastify({
 *  // fastify options
 * })
 * await server.register(cors, {
 *   origin: '*',
 *   methods: ['GET', 'OPTIONS'],
 *   strictPreflight: false
 * })
 *
 * const helia = await createHelia()
 *
 * // configure Routing V1 HTTP API routes
 * routes(server, helia)
 *
 * await server.listen({
 *   // fastify listen options
 * })
 *
 * // now make http requests
 * ```
 */

import cors from '@fastify/cors'
import fastify from 'fastify'
import routes from './routes/index.js'
import type { Helia } from '@helia/interface'
import type { FastifyListenOptions, FastifyInstance } from 'fastify'

export interface ServerInit {
  fastify?: FastifyInstance
  listen?: FastifyListenOptions
}

/**
 * Create and return a Routing V1 HTTP API server
 */
export async function createDelegatedRoutingV1HttpApiServer (helia: Helia, init: ServerInit = {}): Promise<FastifyInstance> {
  const server = init.fastify ?? fastify()
  await server.register(cors, {
    origin: '*',
    methods: ['GET', 'OPTIONS'],
    strictPreflight: false
  })

  routes(server, helia)

  await server.listen(init.listen ?? {
    port: 0
  })

  return server
}
