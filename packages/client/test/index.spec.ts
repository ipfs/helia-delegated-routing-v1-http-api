/* eslint-env mocha */

import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { expect } from 'aegir/chai'
import { create as createIpnsRecord, marshal as marshalIpnsRecord } from 'ipns'
import all from 'it-all'
import { CID } from 'multiformats/cid'
import { createRoutingV1HttpApiClient, type RoutingV1HttpApiClient } from '../src/index.js'

if (process.env.ECHO_SERVER == null) {
  throw new Error('Echo server not configured correctly')
}

const serverUrl = process.env.ECHO_SERVER

describe('routing-v1-http-api-client', () => {
  let client: RoutingV1HttpApiClient

  beforeEach(() => {
    client = createRoutingV1HttpApiClient(new URL(serverUrl))
  })

  afterEach(async () => {
    if (client != null) {
      client.stop()
    }
  })

  it('should find providers', async () => {
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
    }]

    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid.toString()}`, {
      method: 'POST',
      body: providers.map(prov => JSON.stringify(prov)).join('\n')
    })

    const provs = await all(client.getProviders(cid))
    expect(provs.map(prov => ({
      id: prov.ID.toString(),
      addrs: prov.Addrs.map(ma => ma.toString())
    }))).to.deep.equal(providers.map(prov => ({
      id: prov.ID,
      addrs: prov.Addrs
    })))
  })

  it('should handle non-json input', async () => {
    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid.toString()}`, {
      method: 'POST',
      body: 'not json'
    })

    const provs = await all(client.getProviders(cid))
    expect(provs).to.be.empty()
  })

  it('should handle bad input providers', async () => {
    const providers = [{
      Metadata: 'gBI=',
      Provider: {
        Bad: 'field'
      }
    }, {
      Metadata: 'gBI=',
      ContextID: '',
      Another: {
        Bad: 'field'
      }
    }]

    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid.toString()}`, {
      method: 'POST',
      body: providers.map(prov => JSON.stringify(prov)).join('\n')
    })

    const provs = await all(client.getProviders(cid))
    expect(provs).to.be.empty()
  })

  it('should handle empty input', async () => {
    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')

    const provs = await all(client.getProviders(cid))
    expect(provs).to.be.empty()
  })

  it('should find peers and only accepts correct peer records', async () => {
    const peerId = await createEd25519PeerId()

    const records = [{
      Protocol: 'transport-bitswap',
      Schema: 'bitswap',
      Metadata: 'gBI=',
      ID: peerId.toString(),
      Addrs: ['/ip4/41.41.41.41/tcp/1234']
    }, {
      Protocol: 'transport-saddle',
      Schema: 'horse-ride',
      Metadata: 'gBI=',
      ID: peerId.toString(),
      Addrs: ['/ip4/41.41.41.41/tcp/1234']
    }, {
      Protocols: ['transport-bitswap'],
      Schema: 'peer',
      Metadata: 'gBI=',
      ID: peerId.toString(),
      Addrs: ['/ip4/42.42.42.42/tcp/1234']
    }, {
      Protocols: ['transport-bitswap'],
      Schema: 'peer',
      Metadata: 'gBI=',
      ID: (await createEd25519PeerId()).toString(),
      Addrs: ['/ip4/42.42.42.42/tcp/1234']
    }]

    // load peer for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-peers/${peerId.toCID().toString()}`, {
      method: 'POST',
      body: records.map(prov => JSON.stringify(prov)).join('\n')
    })

    const peerRecords = await all(client.getPeerInfo(peerId))
    expect(peerRecords.map(peerRecord => ({
      ...peerRecord,
      ID: peerRecord.ID.toString(),
      Addrs: peerRecord.Addrs.map(ma => ma.toString())
    }))).to.deep.equal([
      records[2]
    ])
  })

  it('should get ipns record', async () => {
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

    const ipnsRecord = await client.getIPNS(peerId)
    expect(marshalIpnsRecord(ipnsRecord)).to.equalBytes(marshalIpnsRecord(record))
  })

  it('get ipns record fails with bad record', async () => {
    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    const peerId = await createEd25519PeerId()
    const record = await createIpnsRecord(await createEd25519PeerId(), cid, 0, 1000)

    // load record for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-ipns/${peerId.toCID().toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.ipfs.ipns-record'
      },
      body: marshalIpnsRecord(record)
    })

    await expect(client.getIPNS(peerId)).to.be.rejected()
  })

  it('should put ipns', async () => {
    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    const peerId = await createEd25519PeerId()
    const record = await createIpnsRecord(peerId, cid, 0, 1000)

    await client.putIPNS(peerId, record)

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
})
