import { PassThrough } from 'node:stream'
import { setMaxListeners } from '@libp2p/interface'
import { CID } from 'multiformats/cid'
import type { Helia } from '@helia/interface'
import type { AbortOptions } from '@libp2p/interface'
import type { FastifyInstance } from 'fastify'

interface Params {
  cid: string
}

interface PeerRecord {
  Schema: string
  Protocol?: string[]
  ID: string
  Addrs?: string[]
  Metadata?: string
}

interface Providers {
  Providers: PeerRecord[]
}

const MAX_PROVIDERS = 100

export default function getProvidersV1 (fastify: FastifyInstance, helia: Helia): void {
  fastify.route<{ Params: Params }>({
    method: 'GET',
    url: '/routing/v1/providers/:cid',
    schema: {
      // request needs to have a querystring with a `name` parameter
      params: {
        type: 'object',
        properties: {
          cid: {
            type: 'string'
          }
        },
        required: ['cid']
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
        const { cid: cidStr } = request.params
        cid = CID.parse(cidStr)
      } catch (err) {
        fastify.log.error({ err }, 'could not parse CID from params')
        return reply.code(422).type('text/html').send('Unprocessable Entity')
      }

      if (request.headers.accept?.includes('application/x-ndjson') === true) {
        const stream = new PassThrough()

        // wait until we have the first result
        const iterable = streamingHandler(cid, helia, {
          signal: controller.signal
        })
        const result = await iterable.next()

        // if we have a value, send the value in a stream
        if (result.done !== true) {
          stream.push(JSON.stringify(result.value) + '\n')

          // iterate over the rest of the results
          void Promise.resolve().then(async () => {
            for await (const prov of iterable) {
              stream.push(JSON.stringify(prov) + '\n')
            }
          })
            .catch(err => {
              fastify.log.error('could send stream of providers', err)
            })
            .finally(() => {
              stream.end()
            })
        } else {
          // Per IPIP-0513: Return 200 with empty NDJSON stream for no results
          stream.end()
        }

        return reply
          .header('Content-Type', 'application/x-ndjson')
          .send(stream)
      } else {
        const result = await nonStreamingHandler(cid, helia, {
          signal: controller.signal
        })

        // Per IPIP-0513: Always return 200 with results (which may be empty)
        return reply.header('Content-Type', 'application/json').send(result)
      }
    }
  })
}

async function * streamingHandler (cid: CID, helia: Helia, options?: AbortOptions): AsyncGenerator<PeerRecord, void, unknown> {
  let provs = 0

  for await (const prov of helia.routing.findProviders(cid, options)) {
    yield {
      Schema: 'peer',
      ID: prov.id.toString(),
      Addrs: prov.multiaddrs.map(ma => ma.toString())
    }

    provs++

    if (provs > MAX_PROVIDERS) {
      break
    }
  }
}

async function nonStreamingHandler (cid: CID, helia: Helia, options?: AbortOptions): Promise<Providers> {
  const providers = []

  try {
    for await (const prov of helia.routing.findProviders(cid, options)) {
      providers.push({
        Schema: 'peer',
        ID: prov.id.toString(),
        Addrs: prov.multiaddrs.map(ma => ma.toString())
      })

      if (providers.length === MAX_PROVIDERS) {
        break
      }
    }
  } catch (err) {
    if (providers.length === 0) {
      throw err
    }
  }

  return { Providers: providers }
}
