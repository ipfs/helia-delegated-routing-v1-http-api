import { peerIdFromCID } from '@libp2p/peer-id'
import { peerIdToRoutingKey } from 'ipns'
import { CID } from 'multiformats/cid'
import type { Helia } from '@helia/interface'
import type { PeerId } from '@libp2p/interface'
import type { FastifyInstance } from 'fastify'

interface Params {
  name: string
}

export default function getIpnsV1 (fastify: FastifyInstance, helia: Helia): void {
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

      try {
        const rawRecord = await helia.routing.get(peerIdToRoutingKey(peerId), {
          signal: controller.signal
        })

        return await reply
          .header('Content-Type', 'application/vnd.ipfs.ipns-record')
          // one cannot simply send rawRecord https://github.com/fastify/fastify/issues/5118
          .send(Buffer.from(rawRecord, 0, rawRecord.byteLength))
      } catch (err: any) {
        if (err.code === 'ERR_NOT_FOUND' || err.errors?.[0].code === 'ERR_NOT_FOUND') {
          return reply.code(404).send('Record not found')
        }

        throw err
      }
    }
  })
}
