/**
 * @packageDocumentation
 *
 * Configure your existing Fastify instance with routes that conform to the
 * [Routing V1 HTTP API](https://specs.ipfs.tech/routing/http-routing-v1/) spec.
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

import getIpnsV1 from './routing/v1/ipns/get.js'
import putIpnsV1 from './routing/v1/ipns/put.js'
import getPeersV1 from './routing/v1/peers/get.js'
import getProvidersV1 from './routing/v1/providers/get.js'
import type { Helia } from '@helia/interface'
import type { FastifyInstance } from 'fastify'

export default function routes (fastify: FastifyInstance, helia: Helia): void {
  getProvidersV1(fastify, helia)
  getPeersV1(fastify, helia)
  getIpnsV1(fastify, helia)
  putIpnsV1(fastify, helia)
}
