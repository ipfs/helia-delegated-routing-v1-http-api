/* eslint-env mocha */

import { generateKeyPair } from '@libp2p/crypto/keys'
import { contentRoutingSymbol, peerRoutingSymbol, start, stop } from '@libp2p/interface'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import { expect } from 'aegir/chai'
import { createIPNSRecord, marshalIPNSRecord, multihashToIPNSRoutingKey } from 'ipns'
import all from 'it-all'
import { CID } from 'multiformats/cid'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { createDelegatedRoutingV1HttpApiClient } from '../src/index.js'
import type { DelegatedRoutingV1HttpApiClient } from '../src/index.js'
import type { PeerRouting, ContentRouting } from '@libp2p/interface'

const serverUrl = process.env.ECHO_SERVER

if (serverUrl == null) {
  throw new Error('Echo server not configured correctly')
}

describe('libp2p content-routing', () => {
  let client: DelegatedRoutingV1HttpApiClient

  beforeEach(async () => {
    client = createDelegatedRoutingV1HttpApiClient(new URL(serverUrl), { cacheTTL: 0 })
    await start(client)
  })

  afterEach(async () => {
    await stop(client)

    const res = await fetch(`${process.env.ECHO_SERVER}/reset-call-count`)
    await res.text()
  })

  it('should provide a content routing implementation', () => {
    const routing = getContentRouting(client)

    expect(routing).to.be.ok()
  })

  it('should find providers', async () => {
    const routing = getContentRouting(client)

    if (routing == null) {
      throw new Error('ContentRouting not found')
    }

    const providers = [{
      Protocol: 'transport-bitswap',
      Schema: 'bitswap',
      Metadata: 'gBI=',
      ID: (await generateKeyPair('Ed25519')).publicKey.toString(),
      Addrs: ['/ip4/41.41.41.41/tcp/1234']
    }, {
      Protocol: 'transport-bitswap',
      Schema: 'peer',
      Metadata: 'gBI=',
      ID: (await generateKeyPair('Ed25519')).publicKey.toString(),
      Addrs: ['/ip4/42.42.42.42/tcp/1234']
    }, {
      ID: (await generateKeyPair('Ed25519')).publicKey.toString(),
      Addrs: ['/ip4/43.43.43.43/tcp/1234']
    }]

    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid}`, {
      method: 'POST',
      body: JSON.stringify({
        Providers: providers
      })
    })

    const provs = await all(routing.findProviders(cid))
    expect(provs.map(prov => ({
      id: prov.id.toString(),
      multiaddrs: prov.multiaddrs.map(ma => ma.toString())
    }))).to.deep.equal(providers.map(prov => ({
      id: prov.ID,
      multiaddrs: prov.Addrs
    })))
  })

  it('should yield no results if no providers exist', async () => {
    const routing = getContentRouting(client)

    if (routing == null) {
      throw new Error('ContentRouting not found')
    }

    const cid = CID.parse('QmawceGscqN4o8Y8Fv26UUmB454kn2bnkXV5tEQYc4jBd7')

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid}`, {
      method: 'POST',
      body: JSON.stringify({
        Providers: []
      })
    })

    await expect(all(routing.findProviders(cid))).to.eventually.have.lengthOf(0)
  })

  it('should respect abort signal when finding providers', async () => {
    const routing = getContentRouting(client)

    if (routing == null) {
      throw new Error('ContentRouting not found')
    }

    const providers = [{
      ID: (await generateKeyPair('Ed25519')).publicKey.toString(),
      Addrs: ['/ip4/43.43.43.43/tcp/1234']
    }]

    const cid = CID.parse('QmawceGscqN4o8Y8Fv26UUmB454kn2bnkXV5tEQYc4jBd6')

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid}`, {
      method: 'POST',
      body: JSON.stringify({
        Providers: providers
      })
    })

    let findProvidersFinished = false
    let error: any = new Error('temporary error that should be replaced')
    try {
      const controller = new AbortController()
      controller.abort()
      await all(routing.findProviders(cid, { signal: controller.signal }))
      findProvidersFinished = true
    } catch (err: any) {
      error = err
    }
    expect(findProvidersFinished).to.be.false()
    expect(error).to.have.property('message').that.includes('abort', error.message)
  })

  it('should provide without error', async () => {
    const routing = getContentRouting(client)

    if (routing == null) {
      throw new Error('ContentRouting not found')
    }

    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')

    await expect(routing.provide(cid)).to.eventually.be.undefined()
  })

  it('should put ipns records', async () => {
    const routing = getContentRouting(client)

    if (routing == null) {
      throw new Error('ContentRouting not found')
    }

    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    const privateKey = await generateKeyPair('Ed25519')
    const record = await createIPNSRecord(privateKey, cid, 0, 1000)
    const key = multihashToIPNSRoutingKey(privateKey.publicKey.toMultihash())

    await routing.put(key, marshalIPNSRecord(record))

    // load record that our client just PUT to remote server
    const res = await fetch(`${process.env.ECHO_SERVER}/get-ipns/${privateKey.publicKey.toCID()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.ipfs.ipns-record'
      }
    })

    const receivedRecord = new Uint8Array(await res.arrayBuffer())
    expect(marshalIPNSRecord(record)).to.equalBytes(receivedRecord)
  })

  it('should not put other records', async () => {
    const routing = getContentRouting(client)

    if (routing == null) {
      throw new Error('ContentRouting not found')
    }

    const privateKey = await generateKeyPair('Ed25519')
    const key = uint8ArrayConcat([
      uint8ArrayFromString('/an-unknown-key/'),
      privateKey.publicKey.toMultihash().bytes
    ])

    await routing.put(key, Uint8Array.from([0, 1, 2, 3, 4]))

    await expect(getServerCallCount()).to.eventually.equal(0)
  })

  it('should get ipns records', async () => {
    const routing = getContentRouting(client)

    if (routing == null) {
      throw new Error('ContentRouting not found')
    }

    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    const privateKey = await generateKeyPair('Ed25519')
    const record = await createIPNSRecord(privateKey, cid, 0, 1000)

    // load record for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-ipns/${privateKey.publicKey.toCID()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.ipfs.ipns-record'
      },
      body: marshalIPNSRecord(record)
    })

    const key = uint8ArrayConcat([
      uint8ArrayFromString('/ipns/'),
      privateKey.publicKey.toMultihash().bytes
    ])

    const value = await routing.get(key)
    expect(value).to.equalBytes(marshalIPNSRecord(record))
  })

  it('should not get unknown records', async () => {
    const routing = getContentRouting(client)

    if (routing == null) {
      throw new Error('ContentRouting not found')
    }

    const privateKey = await generateKeyPair('Ed25519')

    const key = uint8ArrayConcat([
      uint8ArrayFromString('/am-unknown-key/'),
      privateKey.publicKey.toMultihash().bytes
    ])

    await expect(routing.get(key)).to.eventually.be.rejected
      .with.property('name', 'NotFoundError')

    await expect(getServerCallCount()).to.eventually.equal(0)
  })
})

describe('libp2p peer-routing', () => {
  let client: DelegatedRoutingV1HttpApiClient

  beforeEach(async () => {
    client = createDelegatedRoutingV1HttpApiClient(new URL(serverUrl))
    await start(client)
  })

  afterEach(async () => {
    await stop(client)
  })

  describe('peer routing', () => {
    it('should provide a peer routing implementation', () => {
      const routing = getPeerRouting(client)

      expect(routing).to.be.ok()
    })

    it('should find peer info', async () => {
      const routing = getPeerRouting(client)

      if (routing == null) {
        throw new Error('PeerRouting not found')
      }

      const privateKey = await generateKeyPair('Ed25519')
      const peerId = peerIdFromPrivateKey(privateKey)

      const records = [{
        Protocol: 'transport-bitswap',
        Schema: 'peer',
        Metadata: 'gBI=',
        ID: peerId.toString(),
        Addrs: ['/ip4/41.41.41.41/tcp/1234']
      }]

      // load peer for the router to fetch
      await fetch(`${process.env.ECHO_SERVER}/add-peers/${peerId.toCID().toString()}`, {
        method: 'POST',
        body: records.map(prov => JSON.stringify(prov)).join('\n')
      })

      const peerInfo = await routing.findPeer(peerId)

      expect(peerInfo.id.toString()).to.equal(records[0].ID)
      expect(peerInfo.multiaddrs.map(ma => ma.toString())).to.deep.equal(records[0].Addrs)
    })

    it('should not get closest peers', async () => {
      const routing = getPeerRouting(client)

      if (routing == null) {
        throw new Error('PeerRouting not found')
      }

      await expect(all(routing.getClosestPeers(Uint8Array.from([0, 1, 2, 3, 4])))).to.eventually.be.empty()
    })
  })
})

function getContentRouting (obj: any): ContentRouting {
  const routing = obj?.[contentRoutingSymbol]

  if (routing == null) {
    throw new Error('ContentRouting not found')
  }

  return routing
}

function getPeerRouting (obj: any): PeerRouting {
  const routing = obj?.[peerRoutingSymbol]

  if (routing == null) {
    throw new Error('PeerRouting not found')
  }

  return routing
}

async function getServerCallCount (): Promise<number> {
  const res = await fetch(`${process.env.ECHO_SERVER}/get-call-count`)
  const body = await res.text()

  return Number(body)
}
