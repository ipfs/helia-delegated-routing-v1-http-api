/* eslint-env mocha */

import { generateKeyPair } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { expect } from 'aegir/chai'
import { createIPNSRecord, marshalIPNSRecord, multihashToIPNSRoutingKey } from 'ipns'
import { CID } from 'multiformats'
import { stubInterface } from 'sinon-ts'
import { createDelegatedRoutingV1HttpApiServer } from '../src/index.js'
import type { Helia } from '@helia/interface'
import type { PeerInfo } from '@libp2p/interface'
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
    helia.routing.findProviders = async function * () {}

    const res = await fetch(`${url}routing/v1/providers/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn`, {
      method: 'GET'
    })

    expect(res.status).to.equal(404)
  })

  it('GET providers returns 404 if no providers are found when streaming', async () => {
    helia.routing.findProviders = async function * () {}

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
      id: peerIdFromPrivateKey(await generateKeyPair('Ed25519')),
      multiaddrs: [
        multiaddr('/ip4/123.123.123.123/tcp/123')
      ]
    }
    const provider2: PeerInfo = {
      id: peerIdFromPrivateKey(await generateKeyPair('Ed25519')),
      multiaddrs: [
        multiaddr('/ip4/123.123.123.123/tcp/123')
      ]
    }

    helia.routing.findProviders = async function * () {
      yield provider1
      yield provider2
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
      id: peerIdFromPrivateKey(await generateKeyPair('Ed25519')),
      multiaddrs: [
        multiaddr('/ip4/123.123.123.123/tcp/123')
      ]
    }
    const provider2: PeerInfo = {
      id: peerIdFromPrivateKey(await generateKeyPair('Ed25519')),
      multiaddrs: [
        multiaddr('/ip4/123.123.123.123/tcp/123')
      ]
    }

    helia.routing.findProviders = async function * () {
      yield provider1
      yield provider2
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
    const res = await fetch(`${url}routing/v1/peers/${peerIdFromPrivateKey(await generateKeyPair('Ed25519')).toString()}`, {
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
      id: peerIdFromPrivateKey(await generateKeyPair('Ed25519')),
      multiaddrs: [
        multiaddr('/ip4/123.123.123.123/tcp/123')
      ]
    }

    helia.routing.findPeer = async function () {
      return peer
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
    const res = await fetch(`${url}routing/v1/ipns/${peerIdFromPrivateKey(await generateKeyPair('Ed25519')).toString()}`, {
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
    const privateKey = await generateKeyPair('Ed25519')
    const peerId = peerIdFromPrivateKey(privateKey)
    const cid = CID.parse('bafkreifjjcie6lypi6ny7amxnfftagclbuxndqonfipmb64f2km2devei4')
    const record = await createIPNSRecord(privateKey, cid, 0, 1000)

    helia.routing.get = async function () {
      return marshalIPNSRecord(record)
    }

    const res = await fetch(`${url}routing/v1/ipns/${peerId.toCID().toString()}`, {
      method: 'GET',
      headers: {
        accept: 'application/vnd.ipfs.ipns-record'
      }
    })

    expect(res.status).to.equal(200)
    const arrayBuffer = await res.arrayBuffer()
    expect(new Uint8Array(arrayBuffer)).to.equalBytes(marshalIPNSRecord(record))
  })

  it('PUT ipns puts record', async () => {
    const privateKey = await generateKeyPair('Ed25519')
    const peerId = peerIdFromPrivateKey(privateKey)
    const cid = CID.parse('bafkreifjjcie6lypi6ny7amxnfftagclbuxndqonfipmb64f2km2devei4')
    const record = await createIPNSRecord(privateKey, cid, 0, 1000)
    const marshalledRecord = marshalIPNSRecord(record)

    let putKey: Uint8Array = new Uint8Array()
    let putValue: Uint8Array = new Uint8Array()

    helia.routing.put = async function (key: Uint8Array, value: Uint8Array) {
      putKey = key
      putValue = value
    }

    const res = await fetch(`${url}routing/v1/ipns/${peerId.toCID().toString()}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/vnd.ipfs.ipns-record'
      },
      body: marshalledRecord
    })

    expect(res.status).to.equal(200)
    expect(putKey).to.equalBytes(multihashToIPNSRoutingKey(privateKey.publicKey.toMultihash()))
    expect(putValue).to.equalBytes(marshalledRecord)
  })
})
