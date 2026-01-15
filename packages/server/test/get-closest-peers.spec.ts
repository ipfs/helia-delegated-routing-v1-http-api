import { generateKeyPair } from '@libp2p/crypto/keys'
import { NotFoundError } from '@libp2p/interface'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { expect } from 'aegir/chai'
import { stubInterface } from 'sinon-ts'
import { createDelegatedRoutingV1HttpApiServer } from '../src/index.js'
import type { Helia } from '@helia/interface'
import type { PeerInfo } from '@libp2p/interface'
import type { FastifyInstance } from 'fastify'
import type { StubbedInstance } from 'sinon-ts'

describe('get closest peers', () => {
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

  it('GET peers returns 422 if key is not peer id or cid', async () => {
    const res = await fetch(`${url}routing/v1/dht/closest/peers/derp`, {
      method: 'GET'
    })

    expect(res.status).to.equal(422)
  })

  it('GET peers returns peer records for get peers', async () => {
    const peer: PeerInfo = {
      id: peerIdFromPrivateKey(await generateKeyPair('Ed25519')),
      multiaddrs: [
        multiaddr('/ip4/123.123.123.123/tcp/123')
      ]
    }

    helia.routing.getClosestPeers = async function * () {
      yield peer
    }

    const res = await fetch(`${url}routing/v1/dht/closest/peers/${peer.id.toCID().toString()}`, {
      method: 'GET'
    })
    expect(res.status).to.equal(200)

    const json = await res.json()
    expect(json).to.have.nested.property('Peers[0].Schema', 'peer')
    expect(json).to.have.nested.property('Peers[0].ID', peer.id.toString())
    expect(json).to.have.deep.nested.property('Peers[0].Addrs', peer.multiaddrs.map(ma => ma.toString()))
  })

  it('GET peers returns 200 with empty array if peer is not found', async () => {
    const peerId = peerIdFromPrivateKey(await generateKeyPair('Ed25519'))

    // eslint-disable-next-line require-yield
    helia.routing.getClosestPeers = async function * () {
      throw new NotFoundError('Not found')
    }

    const res = await fetch(`${url}routing/v1/dht/closest/peers/${peerId.toCID().toString()}`, {
      method: 'GET'
    })
    expect(res.status).to.equal(200)

    const json = await res.json()
    expect(json).to.have.property('Peers').that.is.an('array').with.lengthOf(0)
  })

  it('GET peers returns 200 with empty NDJSON if peer is not found when streaming', async () => {
    const peerId = peerIdFromPrivateKey(await generateKeyPair('Ed25519'))

    // eslint-disable-next-line require-yield
    helia.routing.getClosestPeers = async function * () {
      throw new NotFoundError('Not found')
    }

    const res = await fetch(`${url}routing/v1/dht/closest/peers/${peerId.toCID().toString()}`, {
      method: 'GET',
      headers: {
        accept: 'application/x-ndjson'
      }
    })
    expect(res.status).to.equal(200)

    const text = await res.text()
    expect(text).to.equal('')
  })
})
