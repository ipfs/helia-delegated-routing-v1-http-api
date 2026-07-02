import { delegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client'
import { createDelegatedRoutingV1HttpApiServer } from '@helia/delegated-routing-v1-http-api-server'
import { ipns, IPNSEntry } from '@helia/ipns'
import { createIPNSRecord } from '@helia/ipns'
import { ed25519Crypto } from '@ipshipyard/crypto'
import { start, stop } from '@libp2p/interface'
import { defaultLogger } from '@libp2p/logger'
import { expect } from 'aegir/chai'
import first from 'it-first'
import last from 'it-last'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { createHelia } from './fixtures/create-helia.ts'
import type { DelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client'
import type { HeliaWithLibp2p } from '@helia/libp2p'
import type { KadDHT } from '@libp2p/kad-dht'
import type { Keychain } from '@libp2p/keychain'
import type { FastifyInstance } from 'fastify'

describe('delegated-routing-v1-http-api interop', () => {
  let network: Array<HeliaWithLibp2p<{ dht: KadDHT, keychain: Keychain }>>
  let server: FastifyInstance
  let client: DelegatedRoutingV1HttpApiClient

  beforeEach(async () => {
    network = await Promise.all(
      new Array(10).fill(0).map(async () => createHelia())
    )

    server = await createDelegatedRoutingV1HttpApiServer(network[0])

    const address = server.server.address()
    const port = typeof address === 'string' ? address : address?.port

    client = delegatedRoutingV1HttpApiClient({
      url: new URL(`http://127.0.0.1:${port}`)
    })({
      logger: defaultLogger()
    })

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
    await Promise.all(network.map(async node => node.stop()))
    await server?.close()
    await stop(client)
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
      if (network.some(node => node.libp2p.peerId.toCID().equals(prov.ID))) {
        foundProvider = true
        break
      }
    }

    expect(foundProvider).to.be.true('did not find provider')
  })

  it('should find peer info', async () => {
    const result = await first(client.getPeers(network[2].libp2p.peerId.toCID()))

    if (result == null) {
      throw new Error('PeerInfo not found')
    }

    expect(result.ID).to.deep.equal(network[2].libp2p.peerId.toCID())
  })

  it('should get an IPNS record', async () => {
    // publish a record using a remote host
    const i = ipns(network[5])
    const cid = CID.parse('bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354')
    const result = await i.publish('key-name', cid)

    // use client to resolve the published record
    const buf = await client.getIPNS(result.publicKey.toCID())
    const record = IPNSEntry.decode(buf)
    expect(record.value).to.equalBytes(uint8ArrayFromString(`/ipfs/${cid}`))
  })

  it('should put an IPNS record', async () => {
    // publish a record using the client
    const cid = CID.parse('bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354')
    const privateKey = await ed25519Crypto().generatePrivateKey()
    const record = await createIPNSRecord(privateKey, `/ipfs/${cid}`, 0, 1000 * 60 * 60 * 24)
    const buf = IPNSEntry.encode(record)

    await client.putIPNS(privateKey.publicKey.toCID(), buf)

    // resolve the record using a remote host
    const i = ipns(network[8])
    const result = await last(i.resolve(privateKey.publicKey.toCID()))
    expect(result?.value).to.equal(`/ipfs/${cid}`)
  })
})
