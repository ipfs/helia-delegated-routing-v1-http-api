import { PassThrough } from 'node:stream'
import { setMaxListeners } from '@libp2p/interface'
import { peerIdFromString } from '@libp2p/peer-id'
import { CID } from 'multiformats/cid'
import { isNotFoundError } from '../../../errors.js'
import type { Helia } from '@helia/interface'
import type { FastifyInstance } from 'fastify'

interface Params {
  key: string
}

export default function getDhtClosestPeersV1 (fastify: FastifyInstance, helia: Helia): void {
  fastify.route<{ Params: Params }>({
    method: 'GET',
    url: '/routing/v1/dht/closest/peers/:key',
    schema: {
      // request needs to have a querystring with a `name` parameter
      params: {
        type: 'object',
        properties: {
          key: {
            type: 'string'
          }
        },
        required: ['key']
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
        const { key } = request.params

        try {
          cid = CID.parse(key)
        } catch {
          const peerId = peerIdFromString(key)
          cid = peerId.toCID()
        }
      } catch (err) {
        fastify.log.error({ err }, 'could not parse CID from params')
        return reply.code(422).type('text/html').send('Unprocessable Entity')
      }

      try {
        if (request.headers.accept?.includes('application/x-ndjson') === true) {
          const stream = new PassThrough()

          Promise.resolve()
            .then(async () => {
              for await (const peerInfo of helia.routing.getClosestPeers(cid.multihash.bytes, {
                signal: controller.signal
              })) {
                stream.push(JSON.stringify({
                  Schema: 'peer',
                  ID: peerInfo.id.toString(),
                  Addrs: peerInfo.multiaddrs.map(ma => ma.toString())
                }) + '\n')
              }
            })
            .catch(err => {
              fastify.log.error({ err }, 'could not get closest peers')
            })
            .finally(() => {
              stream.end()
            })

          // these are .thenables but not .catchables?
          return await reply
            .header('Content-Type', 'application/x-ndjson')
            .send(stream)
        } else {
          const peers = []

          for await (const peerInfo of helia.routing.getClosestPeers(cid.multihash.bytes, {
            signal: controller.signal
          })) {
            peers.push({
              Schema: 'peer',
              ID: peerInfo.id.toString(),
              Addrs: peerInfo.multiaddrs.map(ma => ma.toString())
            })
          }

          return await reply
            .header('Content-Type', 'application/json')
            .send({
              Peers: peers
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
