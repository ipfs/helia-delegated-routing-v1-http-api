/* eslint-env mocha */

import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { multiaddr } from '@multiformats/multiaddr'
import { expect } from 'aegir/chai'
import { create as createIpnsRecord, marshal as marshalIpnsRecord, peerIdToRoutingKey } from 'ipns'
import { CID } from 'multiformats'
import { stubInterface } from 'sinon-ts'
import { createDelegatedRoutingV1HttpApiServer } from '../src/index.js'
import type { Helia } from '@helia/interface'
import type { PeerInfo } from '@libp2p/interface/peer-info'
import type { FastifyInstance } from 'fastify'
import type { StubbedInstance } from 'sinon-ts'

describe('delegated-routing-v1-http-api-server', () => {
  let helia: StubbedInstance<Helia>
  let server: FastifyInstance
  let url: URL

  beforeEach(async () => {
    helia = stubInterface<Helia>()
    server = await createDelegatedRoutingV1HttpApiServer(helia, {
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

  it('GET providers returns 422 if the CID is invalid', async () => {
    const res = await fetch(`${url}routing/v1/providers/derp`, {
      method: 'GET'
    })

    expect(res.status).to.equal(422)
  })

  it('GET providers returns 404 if the CID is missing', async () => {
    const res = await fetch(`${url}routing/v1/providers`, {
      method: 'GET'
    })

    expect(res.status).to.equal(404)
  })

  it('GET providers returns 404 if no providers are found', async () => {
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

  it('GET providers returns 404 if no providers are found when streaming', async () => {
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

  it('GET providers returns providers', async () => {
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

    expect(json).to.have.nested.property('Providers[0].Schema', 'peer')
    expect(json).to.have.nested.property('Providers[0].ID', provider1.id.toString())
    expect(json).to.have.deep.nested.property('Providers[0].Addrs', provider1.multiaddrs.map(ma => ma.toString()))
    expect(json).to.have.nested.property('Providers[1].Schema', 'peer')
    expect(json).to.have.nested.property('Providers[1].ID', provider2.id.toString())
    expect(json).to.have.deep.nested.property('Providers[1].Addrs', provider2.multiaddrs.map(ma => ma.toString()))
  })

  it('GET providers returns provider stream', async () => {
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

    expect(json).to.have.nested.property('[0].Schema', 'peer')
    expect(json).to.have.nested.property('[0].ID', provider1.id.toString())
    expect(json).to.have.deep.nested.property('[0].Addrs', provider1.multiaddrs.map(ma => ma.toString()))
    expect(json).to.have.nested.property('[1].Schema', 'peer')
    expect(json).to.have.nested.property('[1].ID', provider2.id.toString())
    expect(json).to.have.deep.nested.property('[1].Addrs', provider2.multiaddrs.map(ma => ma.toString()))
  })

  it('GET peers returns 422 if peer id is not cid', async () => {
    const res = await fetch(`${url}routing/v1/peers/${(await createEd25519PeerId()).toString()}`, {
      method: 'GET'
    })

    expect(res.status).to.equal(422)
  })

  it('GET peers returns 422 if cid is not peer id', async () => {
    const res = await fetch(`${url}routing/v1/peers/bafkreifjjcie6lypi6ny7amxnfftagclbuxndqonfipmb64f2km2devei4`, {
      method: 'GET'
    })

    expect(res.status).to.equal(422)
  })

  it('GET peers returns peer records for get peers', async () => {
    const peer: PeerInfo = {
      id: await createEd25519PeerId(),
      multiaddrs: [
        multiaddr('/ip4/123.123.123.123/tcp/123')
      ],
      protocols: ['transport-bitswap']
    }

    helia.libp2p = {
      // @ts-expect-error incomplete implementation
      peerRouting: {
        findPeer: async function () {
          return peer
        }
      }
    }

    const res = await fetch(`${url}routing/v1/peers/${peer.id.toCID().toString()}`, {
      method: 'GET'
    })
    expect(res.status).to.equal(200)

    const json = await res.json()
    expect(json).to.have.nested.property('Peers[0].Schema', 'peer')
    expect(json).to.have.nested.property('Peers[0].ID', peer.id.toString())
    expect(json).to.have.deep.nested.property('Peers[0].Addrs', peer.multiaddrs.map(ma => ma.toString()))
  })

  it('GET ipns returns 422 if peer id is not cid', async () => {
    const res = await fetch(`${url}routing/v1/ipns/${(await createEd25519PeerId()).toString()}`, {
      method: 'GET'
    })

    expect(res.status).to.equal(422)
  })

  it('GET ipns returns 422 if cid is not peer id', async () => {
    const res = await fetch(`${url}routing/v1/ipns/bafkreifjjcie6lypi6ny7amxnfftagclbuxndqonfipmb64f2km2devei4`, {
      method: 'GET'
    })

    expect(res.status).to.equal(422)
  })

  it('GET ipns returns record', async () => {
    const peerId = await createEd25519PeerId()
    const cid = CID.parse('bafkreifjjcie6lypi6ny7amxnfftagclbuxndqonfipmb64f2km2devei4')
    const record = await createIpnsRecord(peerId, cid, 0, 1000)

    helia.libp2p = {
      // @ts-expect-error incomplete implementation
      contentRouting: {
        get: async function () {
          return marshalIpnsRecord(record)
        }
      }
    }

    const res = await fetch(`${url}routing/v1/ipns/${peerId.toCID().toString()}`, {
      method: 'GET',
      headers: {
        accept: 'application/vnd.ipfs.ipns-record'
      }
    })

    expect(res.status).to.equal(200)
    const arrayBuffer = await res.arrayBuffer()
    expect(new Uint8Array(arrayBuffer)).to.equalBytes(marshalIpnsRecord(record))
  })

  it('PUT ipns puts record', async () => {
    const peerId = await createEd25519PeerId()
    const cid = CID.parse('bafkreifjjcie6lypi6ny7amxnfftagclbuxndqonfipmb64f2km2devei4')
    const record = await createIpnsRecord(peerId, cid, 0, 1000)
    const marshalledRecord = marshalIpnsRecord(record)

    let putKey: Uint8Array = new Uint8Array()
    let putValue: Uint8Array = new Uint8Array()

    helia.libp2p = {
      // @ts-expect-error incomplete implementation
      contentRouting: {
        put: async function (key: Uint8Array, value: Uint8Array) {
          putKey = key
          putValue = value
        }
      }
    }

    const res = await fetch(`${url}routing/v1/ipns/${peerId.toCID().toString()}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/vnd.ipfs.ipns-record'
      },
      body: marshalledRecord
    })

    expect(res.status).to.equal(200)
    expect(putKey).to.equalBytes(peerIdToRoutingKey(peerId))
    expect(putValue).to.equalBytes(marshalledRecord)
  })
})
