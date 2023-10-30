/* eslint-disable max-nested-callbacks */
/* eslint-env mocha */

import { contentRouting, type ContentRouting } from '@libp2p/interface/content-routing'
import { type PeerRouting, peerRouting } from '@libp2p/interface/peer-routing'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { expect } from 'aegir/chai'
import { create as createIpnsRecord, marshal as marshalIpnsRecord } from 'ipns'
import all from 'it-all'
import { CID } from 'multiformats/cid'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { createDelegatedRoutingV1HttpApiClient, type DelegatedRoutingV1HttpApiClient } from '../src/index.js'

const serverUrl = process.env.ECHO_SERVER

if (serverUrl == null) {
  throw new Error('Echo server not configured correctly')
}

describe('libp2p content-routing', () => {
  let client: DelegatedRoutingV1HttpApiClient

  beforeEach(() => {
    client = createDelegatedRoutingV1HttpApiClient(new URL(serverUrl))
  })

  afterEach(async () => {
    if (client != null) {
      client.stop()
    }

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
      ID: (await createEd25519PeerId()).toString(),
      Addrs: ['/ip4/41.41.41.41/tcp/1234']
    }, {
      Protocols: ['transport-bitswap'],
      Schema: 'peer',
      Metadata: 'gBI=',
      ID: (await createEd25519PeerId()).toString(),
      Addrs: ['/ip4/42.42.42.42/tcp/1234']
    }, {
      ID: (await createEd25519PeerId()).toString(),
      Addrs: ['/ip4/43.43.43.43/tcp/1234']
    }]

    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid.toString()}`, {
      method: 'POST',
      body: providers.map(prov => JSON.stringify(prov)).join('\n')
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
    const peerId = await createEd25519PeerId()
    const record = await createIpnsRecord(peerId, cid, 0, 1000)
    const key = uint8ArrayConcat([
      uint8ArrayFromString('/ipns/'),
      peerId.toBytes()
    ])

    await routing.put(key, marshalIpnsRecord(record))

    // load record that our client just PUT to remote server
    const res = await fetch(`${process.env.ECHO_SERVER}/get-ipns/${peerId.toCID().toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.ipfs.ipns-record'
      }
    })

    const receivedRecord = new Uint8Array(await res.arrayBuffer())
    expect(marshalIpnsRecord(record)).to.equalBytes(receivedRecord)
  })

  it('should not put other records', async () => {
    const routing = getContentRouting(client)

    if (routing == null) {
      throw new Error('ContentRouting not found')
    }

    const peerId = await createEd25519PeerId()
    const key = uint8ArrayConcat([
      uint8ArrayFromString('/an-unknown-key/'),
      peerId.toBytes()
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
    const peerId = await createEd25519PeerId()
    const record = await createIpnsRecord(peerId, cid, 0, 1000)

    // load record for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-ipns/${peerId.toCID().toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.ipfs.ipns-record'
      },
      body: marshalIpnsRecord(record)
    })

    const key = uint8ArrayConcat([
      uint8ArrayFromString('/ipns/'),
      peerId.toBytes()
    ])

    const value = await routing.get(key)
    expect(value).to.equalBytes(marshalIpnsRecord(record))
  })

  it('should not get other records', async () => {
    const routing = getContentRouting(client)

    if (routing == null) {
      throw new Error('ContentRouting not found')
    }

    const peerId = await createEd25519PeerId()

    const key = uint8ArrayConcat([
      uint8ArrayFromString('/am-unknown-key/'),
      peerId.toBytes()
    ])

    await expect(routing.get(key)).to.eventually.be.rejected
      .with.property('code', 'ERR_NOT_FOUND')

    await expect(getServerCallCount()).to.eventually.equal(0)
  })
})

describe('libp2p peer-routing', () => {
  let client: DelegatedRoutingV1HttpApiClient

  beforeEach(() => {
    client = createDelegatedRoutingV1HttpApiClient(new URL(serverUrl))
  })

  afterEach(async () => {
    if (client != null) {
      client.stop()
    }
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

      const peerId = await createEd25519PeerId()

      const records = [{
        Protocols: ['transport-bitswap'],
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
  const routing = obj?.[contentRouting]

  if (routing == null) {
    throw new Error('ContentRouting not found')
  }

  return routing
}

function getPeerRouting (obj: any): PeerRouting {
  const routing = obj?.[peerRouting]

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
