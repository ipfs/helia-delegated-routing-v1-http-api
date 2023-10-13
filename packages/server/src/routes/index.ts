import getIpnsV1 from './routing/v1/ipns/get.js'
import getPeersV1 from './routing/v1/peers/get.js'
import getProvidersV1 from './routing/v1/providers/get.js'
import type { Helia } from '@helia/interface'
import type { FastifyInstance } from 'fastify'

export default function routes (fastify: FastifyInstance, helia: Helia): void {
  getProvidersV1(fastify, helia)
  getPeersV1(fastify, helia)
  getIpnsV1(fastify, helia)
}
