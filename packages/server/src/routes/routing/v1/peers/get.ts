import { PassThrough } from 'node:stream'
import { setMaxListeners } from '@libp2p/interface'
import { peerIdFromCID } from '@libp2p/peer-id'
import { CID } from 'multiformats/cid'
import { isNotFoundError } from '../errors.js'
import type { Helia } from '@helia/interface'
import type { PeerId } from '@libp2p/interface'
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
      const controller = new AbortController()
      setMaxListeners(Infinity, controller.signal)

      request.raw.on('close', () => {
        controller.abort()
      })

      try {
        const { peerId: cidStr } = request.params
        const peerCid = CID.parse(cidStr)
        peerId = peerIdFromCID(peerCid)
      } catch (err: any) {
        fastify.log.error('could not parse CID from params', err)
        return reply.code(422).type('text/html').send('Unprocessable Entity')
      }

      try {
        const peerInfo = await helia.routing.findPeer(peerId, {
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
          return await reply
            .header('Content-Type', 'application/x-ndjson')
            .send(stream)
        } else {
          return await reply
            .header('Content-Type', 'application/json')
            .send({
              Peers: [peerRecord]
            })
        }
      } catch (err: any) {
        // Per IPIP-0513: Return 200 with empty results when peer is not found
        if (isNotFoundError(err)) {
          if (request.headers.accept?.includes('application/x-ndjson') === true) {
            const stream = new PassThrough()
            stream.end() // Empty NDJSON stream
            return reply
              .header('Content-Type', 'application/x-ndjson')
              .send(stream)
          } else {
            return reply
              .header('Content-Type', 'application/json')
              .send({
                Peers: []
              })
          }
        }
        throw err
      }
    }
  })
}
