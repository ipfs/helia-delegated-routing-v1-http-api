import { PassThrough } from 'node:stream'
import { CID } from 'multiformats/cid'
import type { AbortOptions, Libp2p } from '@libp2p/interface'
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

export default function getProvidersV1 (fastify: FastifyInstance, libp2p: Libp2p): void {
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

      request.raw.on('close', () => {
        controller.abort()
      })

      try {
        const { cid: cidStr } = request.params
        cid = CID.parse(cidStr)
      } catch (err) {
        fastify.log.error('could not parse CID from params', err)
        return reply.code(422).type('text/html').send('Unprocessable Entity')
      }

      if (request.headers.accept?.includes('application/x-ndjson') === true) {
        const stream = new PassThrough()

        // wait until we have the first result
        const iterable = streamingHandler(cid, libp2p, {
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

          return reply
            .header('Content-Type', 'application/x-ndjson')
            .send(stream)
        }
      } else {
        const result = await nonStreamingHandler(cid, libp2p, {
          signal: controller.signal
        })

        if (result.Providers.length > 0) {
          return reply.header('Content-Type', 'application/json').send(result)
        }
      }

      reply.callNotFound()
    }
  })
}

async function * streamingHandler (cid: CID, libp2p: Libp2p, options?: AbortOptions): AsyncGenerator<PeerRecord, void, unknown> {
  let provs = 0

  for await (const prov of libp2p.contentRouting.findProviders(cid, options)) {
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

async function nonStreamingHandler (cid: CID, libp2p: Libp2p, options?: AbortOptions): Promise<Providers> {
  const providers = []

  try {
    for await (const prov of libp2p.contentRouting.findProviders(cid, options)) {
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
