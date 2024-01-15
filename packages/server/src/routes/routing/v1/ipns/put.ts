import { peerIdFromCID } from '@libp2p/peer-id'
import { peerIdToRoutingKey } from 'ipns'
import { ipnsValidator } from 'ipns/validator'
import { CID } from 'multiformats/cid'
import getRawBody from 'raw-body'
import type { Libp2p, PeerId } from '@libp2p/interface'
import type { FastifyInstance } from 'fastify'

interface Params {
  name: string
}

export default function putIpnsV1 (fastify: FastifyInstance, libp2p: Libp2p): void {
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

      // @ts-expect-error request.body does not have a type
      const body: Uint8Array = request.body
      await ipnsValidator(peerIdToRoutingKey(peerId), body)

      await libp2p.contentRouting.put(peerIdToRoutingKey(peerId), body, {
        signal: controller.signal
      })

      return reply.send()
    }
  })
}
