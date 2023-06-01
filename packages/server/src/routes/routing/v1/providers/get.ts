import { PassThrough } from 'node:stream'
import { CID } from 'multiformats/cid'
import type { Helia } from '@helia/interface'
import type { AbortOptions } from '@libp2p/interfaces'
import type { FastifyInstance } from 'fastify'

interface Params {
  cid: string
}

interface Provider {
  Protocol: string
  Schema: string
  ID: string
  Addrs: string[]
}

interface Providers {
  Providers: Provider[]
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
      const { cid: cidStr } = request.params
      const cid = CID.parse(cidStr)

      if (request.headers.accept?.includes('application/x-ndjson') === true) {
        const stream = new PassThrough()

        // these are .thenables but not .catchables?
        reply.header('Content-Type', 'application/x-ndjson') // eslint-disable-line @typescript-eslint/no-floating-promises
        reply.send(stream) // eslint-disable-line @typescript-eslint/no-floating-promises

        try {
          for await (const prov of streamingHandler(cid, helia)) {
            stream.push(JSON.stringify(prov) + '\n')
          }
        } finally {
          stream.end()
        }
      } else {
        // this is .thenable but not .catchable?
        reply.header('Content-Type', 'application/json') // eslint-disable-line @typescript-eslint/no-floating-promises

        return nonStreamingHandler(cid, helia)
      }
    }
  })
}

async function * streamingHandler (cid: CID, helia: Helia, options?: AbortOptions): AsyncGenerator<Provider, void, unknown> {
  let provs = 0

  for await (const prov of helia.libp2p.contentRouting.findProviders(cid, options)) {
    yield {
      Protocol: 'transport-bitswap',
      Schema: 'bitswap',
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
    for await (const prov of helia.libp2p.contentRouting.findProviders(cid, options)) {
      providers.push({
        Protocol: 'transport-bitswap',
        Schema: 'bitswap',
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
