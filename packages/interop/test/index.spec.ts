/* eslint-env mocha */

import { createDelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client'
import { createDelegatedRoutingV1HttpApiServer } from '@helia/delegated-routing-v1-http-api-server'
import { ipns } from '@helia/ipns'
import { generateKeyPair } from '@libp2p/crypto/keys'
import { start, stop } from '@libp2p/interface'
import { type Ping } from '@libp2p/ping'
import { expect } from 'aegir/chai'
import { createIPNSRecord } from 'ipns'
import first from 'it-first'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { createHelia } from './fixtures/create-helia.js'
import type { DelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client'
import type { Libp2p } from '@libp2p/interface'
import type { KadDHT } from '@libp2p/kad-dht'
import type { FastifyInstance } from 'fastify'
import type { HeliaLibp2p } from 'helia'

describe('delegated-routing-v1-http-api interop', () => {
  let network: Array<HeliaLibp2p<Libp2p<{ dht: KadDHT, ping: Ping }>>>
  let server: FastifyInstance
  let client: DelegatedRoutingV1HttpApiClient

  beforeEach(async () => {
    network = await Promise.all(
      new Array(10).fill(0).map(async () => createHelia())
    )

    server = await createDelegatedRoutingV1HttpApiServer(network[0])

    const address = server.server.address()
    const port = typeof address === 'string' ? address : address?.port

    client = createDelegatedRoutingV1HttpApiClient(new URL(`http://127.0.0.1:${port}`))

    for (const node of network) {
      for (const remote of network) {
        if (node === remote) {
          continue
        }

        await node.libp2p.dial(remote.libp2p.getMultiaddrs())
      }
    }

    await start(client)
  })

  afterEach(async () => {
    await stop(client)

    if (server != null) {
      await server.close()
    }

    await Promise.all(network.map(async node => node.stop()))
  })

  it('should find providers', async () => {
    const input = Uint8Array.from([0, 1, 2, 3, 4])
    const digest = await sha256.digest(input)
    const cid = CID.createV1(raw.code, digest)

    await network[1].blockstore.put(cid, input)
    await network[1].routing.provide(cid)

    let foundProvider = false

    for await (const prov of client.getProviders(cid)) {
      // should be a node in this test network
      if (network.map(node => node.libp2p.peerId.toString()).includes(prov.ID.toString())) {
        foundProvider = true
        break
      }
    }

    expect(foundProvider).to.be.true()
  })

  it('should find peer info', async () => {
    const result = await first(client.getPeers(network[2].libp2p.peerId))

    if (result == null) {
      throw new Error('PeerInfo not found')
    }

    expect(result.ID.toString()).to.equal(network[2].libp2p.peerId.toString())
  })

  it.skip('should get an IPNS record', async () => {
    // publish a record using a remote host
    const i = ipns(network[5])
    const cid = CID.parse('bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354')
    const privateKey = await generateKeyPair('Ed25519')
    await i.publish(privateKey, cid)

    // use client to resolve the published record
    const record = await client.getIPNS(privateKey.publicKey.toCID())
    expect(record.value).to.equal(`/ipfs/${cid.toString()}`)
  })

  it.skip('should put an IPNS record', async () => {
    // publish a record using the client
    const cid = CID.parse('bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354')
    const privateKey = await generateKeyPair('Ed25519')
    const record = await createIPNSRecord(privateKey, cid, 0, 1000 * 60 * 60 * 24)

    await client.putIPNS(privateKey.publicKey.toCID(), record)

    // resolve the record using a remote host
    const i = ipns(network[8])
    // @ts-expect-error helia needs to be updated to the latest libp2p deps
    const result = await i.resolve(privateKey.publicKey.toCID())
    expect(result.cid.toString()).to.equal(cid.toString())
  })
})
