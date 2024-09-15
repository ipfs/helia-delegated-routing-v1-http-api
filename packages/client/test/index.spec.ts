/* eslint-env mocha */

import { generateKeyPair } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey, peerIdFromString } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { expect } from 'aegir/chai'
import { createIPNSRecord, marshalIPNSRecord } from 'ipns'
import all from 'it-all'
import { CID } from 'multiformats/cid'
import { createDelegatedRoutingV1HttpApiClient, type DelegatedRoutingV1HttpApiClient } from '../src/index.js'

if (process.env.ECHO_SERVER == null) {
  throw new Error('Echo server not configured correctly')
}

const serverUrl = process.env.ECHO_SERVER

describe('delegated-routing-v1-http-api-client', () => {
  let client: DelegatedRoutingV1HttpApiClient

  beforeEach(() => {
    client = createDelegatedRoutingV1HttpApiClient(new URL(serverUrl))
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
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid.toString()}`, {
      method: 'POST',
      body: providers.map(prov => JSON.stringify(prov)).join('\n')
    })

    const provs = await all(client.getProviders(cid))
    expect(provs.map(prov => ({
      id: prov.ID.toString(),
      addrs: prov.Addrs?.map(ma => ma.toString())
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

  it('should conform records to peer schema', async () => {
    const privateKey = await generateKeyPair('Ed25519')

    const records = [{
      Protocol: 'transport-bitswap',
      Schema: 'bitswap',
      Metadata: 'gBI=',
      ID: privateKey.publicKey.toString(),
      Addrs: ['/ip4/41.41.41.41/tcp/1234']
    }, {
      Protocol: 'transport-saddle',
      Schema: 'horse-ride',
      Metadata: 'gBI=',
      ID: privateKey.publicKey.toString(),
      Addrs: ['/ip4/41.41.41.41/tcp/1234']
    }, {
      Protocols: ['transport-bitswap'],
      Schema: 'peer',
      Metadata: 'gBI=',
      ID: privateKey.publicKey.toString(),
      Addrs: ['/ip4/42.42.42.42/tcp/1234']
    }, {
      Protocol: 'transport-bitswap',
      Schema: 'peer',
      Metadata: 'gBI=',
      ID: (await generateKeyPair('Ed25519')).publicKey.toString(),
      Addrs: ['/ip4/42.42.42.42/tcp/1234']
    }, {
      Schema: 'peer',
      ID: (await generateKeyPair('Ed25519')).publicKey.toString()
    }]

    const peers = [{
      Protocols: ['transport-bitswap'],
      Schema: 'peer',
      Metadata: 'gBI=',
      ID: peerIdFromString(records[0].ID),
      Addrs: [multiaddr('/ip4/41.41.41.41/tcp/1234')]
    }, {
      Protocols: ['transport-saddle'],
      Schema: 'peer',
      Metadata: 'gBI=',
      ID: peerIdFromString(records[1].ID),
      Addrs: [multiaddr('/ip4/41.41.41.41/tcp/1234')]
    }, {
      Protocols: ['transport-bitswap'],
      Schema: 'peer',
      Metadata: 'gBI=',
      ID: peerIdFromString(records[2].ID),
      Addrs: [multiaddr('/ip4/42.42.42.42/tcp/1234')]
    }, {
      Protocols: ['transport-bitswap'],
      Schema: 'peer',
      Metadata: 'gBI=',
      ID: peerIdFromString(records[3].ID),
      Addrs: [multiaddr('/ip4/42.42.42.42/tcp/1234')]
    }, {
      Protocols: [],
      Schema: 'peer',
      ID: peerIdFromString(records[4].ID),
      Addrs: []
    }]

    // load peer for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-peers/${privateKey.publicKey.toCID()}`, {
      method: 'POST',
      body: records.map(prov => JSON.stringify(prov)).join('\n')
    })

    const peerRecords = await all(client.getPeers(peerIdFromPrivateKey(privateKey)))
    expect(peerRecords.map(peerRecord => ({
      ...peerRecord,
      ID: peerRecord.ID.toString(),
      Addrs: peerRecord.Addrs?.map(ma => ma.toString()) ?? []
    }))).to.deep.equal(peers.map(peerRecord => ({
      ...peerRecord,
      ID: peerRecord.ID.toString(),
      Addrs: peerRecord.Addrs?.map(ma => ma.toString())
    })))
  })

  it('should get ipns record', async () => {
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

    const ipnsRecord = await client.getIPNS(privateKey.publicKey.toCID())
    expect(marshalIPNSRecord(ipnsRecord)).to.equalBytes(marshalIPNSRecord(record))
  })

  it('get ipns record fails with bad record', async () => {
    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    const privateKey = await generateKeyPair('Ed25519')
    const otherPrivateKey = await generateKeyPair('Ed25519')
    const record = await createIPNSRecord(otherPrivateKey, cid, 0, 1000)

    // load record for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-ipns/${privateKey.publicKey.toCID()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.ipfs.ipns-record'
      },
      body: marshalIPNSRecord(record)
    })

    await expect(client.getIPNS(privateKey.publicKey.toCID())).to.be.rejected()
  })

  it('should put ipns', async () => {
    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    const privateKey = await generateKeyPair('Ed25519')
    const record = await createIPNSRecord(privateKey, cid, 0, 1000)

    await client.putIPNS(privateKey.publicKey.toCID(), record)

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
})
