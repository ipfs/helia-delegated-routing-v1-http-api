/**
 * @packageDocumentation
 *
 * Implements HTTP routes for a Fastify server that conform to the [Routing V1 HTTP API](https://specs.ipfs.tech/routing/http-routing-v1/).
 *
 * @example
 *
 * ```typescript
 * import { createHelia } from 'helia'
 * import { createRoutingV1HttpApiServer } from '@helia/routing-v1-http-api-server'
 *
 * const helia = await createHelia()
 * const server = await createRoutingV1HttpApiServer(helia, {
 *   fastify: {
 *     // fastify options
 *   },
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
import fastify, { type FastifyListenOptions, type FastifyHttpOptions, type FastifyHttpsOptions, type FastifyInstance } from 'fastify'
import routes from './routes/index.js'
import type { Helia } from '@helia/interface'
import type * as http from 'node:http'
import type * as https from 'node:https'

export interface ServerInit {
  fastify?: FastifyHttpOptions<http.Server> | FastifyHttpsOptions<https.Server>
  listen?: FastifyListenOptions
}

/**
 * Create and return a Helia node
 */
export async function createRoutingV1HttpApiServer (helia: Helia, init: ServerInit = {}): Promise<FastifyInstance> {
  const server = fastify(init.fastify)
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
