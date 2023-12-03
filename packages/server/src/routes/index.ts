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
import type { Libp2p } from '@libp2p/interface'
import type { FastifyInstance } from 'fastify'

export default function routes (fastify: FastifyInstance, libp2p: Libp2p): void {
  getProvidersV1(fastify, libp2p)
  getPeersV1(fastify, libp2p)
  getIpnsV1(fastify, libp2p)
  putIpnsV1(fastify, libp2p)
}
