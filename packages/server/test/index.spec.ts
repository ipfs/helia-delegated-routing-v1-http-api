/* eslint-env mocha */

import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { multiaddr } from '@multiformats/multiaddr'
import { expect } from 'aegir/chai'
import { stubInterface } from 'sinon-ts'
import { createRoutingV1HttpApiServer } from '../src/index.js'
import type { Helia } from '@helia/interface'
import type { PeerInfo } from '@libp2p/interface/peer-info'
import type { FastifyInstance } from 'fastify'
import type { StubbedInstance } from 'sinon-ts'

describe('routing-v1-http-api-server', () => {
  let helia: StubbedInstance<Helia>
  let server: FastifyInstance
  let url: URL

  beforeEach(async () => {
    helia = stubInterface<Helia>()
    server = await createRoutingV1HttpApiServer(helia, {
      listen: {
        host: '127.0.0.1',
        port: 0
      }
    })

    const address = server.server.address()
    const port = typeof address === 'string' ? address : address?.port

    expect(port).to.be.a('number')

    url = new URL(`http://127.0.0.1:${port}`)
  })

  afterEach(async () => {
    if (server != null) {
      await server.close()
    }
  })

  it('supports CORS', async () => {
    const res = await fetch(`${url}routing/v1/providers/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn`, {
      method: 'OPTIONS'
    })

    expect(res.headers.get('access-control-allow-origin')).to.equal('*')
    expect(res.headers.get('access-control-allow-methods')).to.equal('GET, OPTIONS')
  })

  it('returns 422 if the CID is invalid', async () => {
    const res = await fetch(`${url}routing/v1/providers/derp`, {
      method: 'GET'
    })

    expect(res.status).to.equal(422)
  })

  it('returns 404 if the CID is missing', async () => {
    const res = await fetch(`${url}routing/v1/providers`, {
      method: 'GET'
    })

    expect(res.status).to.equal(404)
  })

  it('returns 404 if no providers are found', async () => {
    helia.libp2p = {
      // @ts-expect-error incomplete implementation
      contentRouting: {
        findProviders: async function * () {}
      }
    }

    const res = await fetch(`${url}routing/v1/providers/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn`, {
      method: 'GET'
    })

    expect(res.status).to.equal(404)
  })

  it('returns 404 if no providers are found when streaming', async () => {
    helia.libp2p = {
      // @ts-expect-error incomplete implementation
      contentRouting: {
        findProviders: async function * () {}
      }
    }

    const res = await fetch(`${url}routing/v1/providers/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn`, {
      method: 'GET',
      headers: {
        accept: 'application/x-ndjson'
      }
    })

    expect(res.status).to.equal(404)
  })

  it('returns providers', async () => {
    const provider1: PeerInfo = {
      id: await createEd25519PeerId(),
      multiaddrs: [
        multiaddr('/ip4/123.123.123.123/tcp/123')
      ],
      protocols: []
    }
    const provider2: PeerInfo = {
      id: await createEd25519PeerId(),
      multiaddrs: [
        multiaddr('/ip4/123.123.123.123/tcp/123')
      ],
      protocols: []
    }

    helia.libp2p = {
      // @ts-expect-error incomplete implementation
      contentRouting: {
        findProviders: async function * () {
          yield provider1
          yield provider2
        }
      }
    }

    const res = await fetch(`${url}routing/v1/providers/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn`, {
      method: 'GET'
    })

    expect(res.status).to.equal(200)

    const json = await res.json()

    expect(json).to.have.nested.property('Providers[0].Protocols[0]', 'transport-bitswap')
    expect(json).to.have.nested.property('Providers[0].Schema', 'peer')
    expect(json).to.have.nested.property('Providers[0].ID', provider1.id.toString())
    expect(json).to.have.deep.nested.property('Providers[0].Addrs', provider1.multiaddrs.map(ma => ma.toString()))
    expect(json).to.have.nested.property('Providers[1].Protocols[0]', 'transport-bitswap')
    expect(json).to.have.nested.property('Providers[1].Schema', 'peer')
    expect(json).to.have.nested.property('Providers[1].ID', provider2.id.toString())
    expect(json).to.have.deep.nested.property('Providers[1].Addrs', provider2.multiaddrs.map(ma => ma.toString()))
  })

  it('returns provider stream', async () => {
    const provider1: PeerInfo = {
      id: await createEd25519PeerId(),
      multiaddrs: [
        multiaddr('/ip4/123.123.123.123/tcp/123')
      ],
      protocols: []
    }
    const provider2: PeerInfo = {
      id: await createEd25519PeerId(),
      multiaddrs: [
        multiaddr('/ip4/123.123.123.123/tcp/123')
      ],
      protocols: []
    }

    helia.libp2p = {
      // @ts-expect-error incomplete implementation
      contentRouting: {
        findProviders: async function * () {
          yield provider1
          yield provider2
        }
      }
    }

    const res = await fetch(`${url}routing/v1/providers/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn`, {
      method: 'GET',
      headers: {
        accept: 'application/x-ndjson'
      }
    })

    expect(res.status).to.equal(200)

    const text = await res.text()
    const json = text.split('\n')
      .filter(Boolean)
      .map(str => JSON.parse(str))

    expect(json).to.have.nested.property('[0].Protocols[0]', 'transport-bitswap')
    expect(json).to.have.nested.property('[0].Schema', 'peer')
    expect(json).to.have.nested.property('[0].ID', provider1.id.toString())
    expect(json).to.have.deep.nested.property('[0].Addrs', provider1.multiaddrs.map(ma => ma.toString()))
    expect(json).to.have.nested.property('[1].Protocols[0]', 'transport-bitswap')
    expect(json).to.have.nested.property('[1].Schema', 'peer')
    expect(json).to.have.nested.property('[1].ID', provider2.id.toString())
    expect(json).to.have.deep.nested.property('[1].Addrs', provider2.multiaddrs.map(ma => ma.toString()))
  })
})
