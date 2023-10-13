import { peerIdFromCID } from '@libp2p/peer-id'
import { peerIdToRoutingKey } from 'ipns'
import { CID } from 'multiformats/cid'
import type { Helia } from '@helia/interface'
import type { PeerId } from '@libp2p/interface/peer-id'
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
      let pid: PeerId

      try {
        // PeerId must be encoded as a Libp2p-key CID.
        const { name: cidStr } = request.params
        const peerCid = CID.parse(cidStr)
        pid = peerIdFromCID(peerCid)
      } catch (err) {
        // these are .thenables but not .catchables?
        reply.code(422).type('text/html').send('Unprocessable Entity') // eslint-disable-line @typescript-eslint/no-floating-promises
        return
      }

      const rawRecord = await helia.libp2p.contentRouting.get(peerIdToRoutingKey(pid))
      reply.header('Content-Type', 'application/vnd.ipfs.ipns-record') // eslint-disable-line @typescript-eslint/no-floating-promises
      return reply.send(rawRecord)
    }
  })
}
