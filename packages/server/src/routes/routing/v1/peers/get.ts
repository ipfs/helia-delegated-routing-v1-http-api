import { PassThrough } from 'node:stream'
import { peerIdFromCID } from '@libp2p/peer-id'
import { CID } from 'multiformats/cid'
import type { Libp2p, PeerId } from '@libp2p/interface'
import type { FastifyInstance } from 'fastify'

interface Params {
  peerId: string
}

export default function getPeersV1 (fastify: FastifyInstance, libp2p: Libp2p): void {
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
      const controller = new AbortController()

      request.raw.on('close', () => {
        controller.abort()
      })

      try {
        const { peerId: cidStr } = request.params
        const peerCid = CID.parse(cidStr)
        peerId = peerIdFromCID(peerCid)
      } catch (err) {
        fastify.log.error('could not parse CID from params', err)
        return reply.code(422).type('text/html').send('Unprocessable Entity')
      }

      const peerInfo = await libp2p.peerRouting.findPeer(peerId, {
        signal: controller.signal
      })
      const peerRecord = {
        Schema: 'peer',
        ID: peerInfo.id.toString(),
        Addrs: peerInfo.multiaddrs.map(ma => ma.toString())
      }

      if (request.headers.accept?.includes('application/x-ndjson') === true) {
        const stream = new PassThrough()
        stream.push(JSON.stringify(peerRecord) + '\n')
        stream.end()

        // these are .thenables but not .catchables?
        return reply
          .header('Content-Type', 'application/x-ndjson')
          .send(stream)
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
