import { PassThrough } from 'node:stream'
import { peerIdFromCID } from '@libp2p/peer-id'
import { CID } from 'multiformats/cid'
import type { Helia } from '@helia/interface'
import type { PeerId } from '@libp2p/interface/peer-id'
import type { FastifyInstance } from 'fastify'

interface Params {
  peerId: string
}

export default function getPeersV1 (fastify: FastifyInstance, helia: Helia): void {
  fastify.route<{ Params: Params }>({
    method: 'GET',
    url: '/routing/v1/peers/:peerId',
    schema: {
      // request needs to have a querystring with a `name` parameter
      params: {
        type: 'object',
        properties: {
          peerId: {
            type: 'string'
          }
        },
        required: ['peerId']
      }
    },
    handler: async (request, reply) => {
      let peerId: PeerId

      try {
        const { peerId: cidStr } = request.params
        const peerCid = CID.parse(cidStr)
        peerId = peerIdFromCID(peerCid)
      } catch (err) {
        fastify.log.error('could not parse CID from params', err)
        return reply.code(422).type('text/html').send('Unprocessable Entity')
      }

      const peerInfo = await helia.libp2p.peerRouting.findPeer(peerId)
      const peerRecord = {
        Schema: 'peer',
        Protocols: ['transport-bitswap'],
        ID: peerInfo.id.toString(),
        Addrs: peerInfo.multiaddrs.map(ma => ma.toString())
      }

      if (request.headers.accept?.includes('application/x-ndjson') === true) {
        const stream = new PassThrough()

        try {
          stream.push(JSON.stringify(peerRecord) + '\n')
          // these are .thenables but not .catchables?
          return await reply
            .header('Content-Type', 'application/x-ndjson')
            .send(stream)
        } finally {
          stream.end()
        }
      } else {
        return reply
          .header('Content-Type', 'application/json')
          .send({
            Peers: [peerRecord]
          })
      }
    }
  })
}
