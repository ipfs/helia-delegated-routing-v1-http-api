import { setMaxListeners } from '@libp2p/interface'
import { multihashToIPNSRoutingKey } from 'ipns'
import { CID } from 'multiformats/cid'
import { hasCode } from 'multiformats/hashes/digest'
import { LIBP2P_KEY_CODEC } from '../../../../constants.js'
import type { Helia } from '@helia/interface'
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
      let cid: CID
      const controller = new AbortController()
      setMaxListeners(Infinity, controller.signal)

      request.raw.on('close', () => {
        controller.abort()
      })

      try {
        // PeerId must be encoded as a Libp2p-key CID.
        const { name: cidStr } = request.params
        cid = CID.parse(cidStr)
      } catch (err) {
        fastify.log.error({ err }, 'could not parse CID from params')
        return reply.code(422).type('text/html').send('Unprocessable Entity')
      }

      try {
        if (!hasCode(cid.multihash, 0x00) && !hasCode(cid.multihash, 0x12)) {
          fastify.log.error('CID multihash had incorrect code %d', cid.multihash.code)
          return await reply.code(422).type('text/html').send('Unprocessable Entity')
        }

        if (cid.code !== LIBP2P_KEY_CODEC) {
          fastify.log.error('CID had incorrect code %d', cid.code)
          return await reply.code(422).type('text/html').send('Unprocessable Entity')
        }

        const rawRecord = await helia.routing.get(multihashToIPNSRoutingKey(cid.multihash), {
          signal: controller.signal
        })

        return await reply
          .header('Content-Type', 'application/vnd.ipfs.ipns-record')
          .send(rawRecord)
      } catch (err: any) {
        if (err.code === 'ERR_NOT_FOUND' || err.errors?.[0].code === 'ERR_NOT_FOUND' ||
            err.name === 'NotFoundError' || err.errors?.[0].name === 'NotFoundError'
        ) {
          return reply.code(404).send('Record not found')
        }

        throw err
      }
    }
  })
}
