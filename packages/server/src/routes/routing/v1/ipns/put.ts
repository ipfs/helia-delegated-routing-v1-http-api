import { setMaxListeners } from '@libp2p/interface'
import { multihashToIPNSRoutingKey } from 'ipns'
import { ipnsValidator } from 'ipns/validator'
import { CID } from 'multiformats/cid'
import { hasCode } from 'multiformats/hashes/digest'
import getRawBody from 'raw-body'
import { LIBP2P_KEY_CODEC } from '../../../../constants.js'
import type { Helia } from '@helia/interface'
import type { FastifyInstance } from 'fastify'

interface Params {
  name: string
}

export default function putIpnsV1 (fastify: FastifyInstance, helia: Helia): void {
  fastify.addContentTypeParser('application/vnd.ipfs.ipns-record', function (request, payload, done) {
    getRawBody(payload)
      .then(buff => { done(null, buff) })
      .catch(err => { done(err) })
  })

  fastify.route<{ Params: Params }>({
    method: 'PUT',
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

      if (!hasCode(cid.multihash, 0x00) && !hasCode(cid.multihash, 0x12)) {
        fastify.log.error('CID multihash had incorrect code %d', cid.multihash.code)
        return reply.code(422).type('text/html').send('Unprocessable Entity')
      }

      if (cid.code !== LIBP2P_KEY_CODEC) {
        fastify.log.error('CID had incorrect code %d', cid.code)
        return reply.code(422).type('text/html').send('Unprocessable Entity')
      }

      // @ts-expect-error request.body does not have a type
      const body: Uint8Array = request.body
      const routingKey = multihashToIPNSRoutingKey(cid.multihash)
      await ipnsValidator(routingKey, body)

      await helia.routing.put(routingKey, body, {
        signal: controller.signal
      })

      return reply.send()
    }
  })
}
