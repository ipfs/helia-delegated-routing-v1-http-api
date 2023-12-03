import { peerIdFromCID } from '@libp2p/peer-id'
import { peerIdToRoutingKey } from 'ipns'
import { CID } from 'multiformats/cid'
import type { Libp2p } from '@libp2p/interface'
import type { PeerId } from '@libp2p/interface/peer-id'
import type { FastifyInstance } from 'fastify'

interface Params {
  name: string
}

export default function getIpnsV1 (fastify: FastifyInstance, libp2p: Libp2p): void {
  fastify.route<{ Params: Params }>({
    method: 'GET',
    url: '/routing/v1/ipns/:name',
    schema: {
      // request needs to have a querystring with a `name` parameter
      params: {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          }
        },
        required: ['name']
      }
    },
    handler: async (request, reply) => {
      let peerId: PeerId
      const controller = new AbortController()

      request.raw.on('close', () => {
        controller.abort()
      })

      try {
        // PeerId must be encoded as a Libp2p-key CID.
        const { name: cidStr } = request.params
        const peerCid = CID.parse(cidStr)
        peerId = peerIdFromCID(peerCid)
      } catch (err) {
        fastify.log.error('could not parse CID from params', err)
        return reply.code(422).type('text/html').send('Unprocessable Entity')
      }

      const rawRecord = await libp2p.contentRouting.get(peerIdToRoutingKey(peerId), {
        signal: controller.signal
      })

      return reply
        .header('Content-Type', 'application/vnd.ipfs.ipns-record')
        // one cannot simply send rawRecord https://github.com/fastify/fastify/issues/5118
        .send(Buffer.from(rawRecord, 0, rawRecord.byteLength))
    }
  })
}
