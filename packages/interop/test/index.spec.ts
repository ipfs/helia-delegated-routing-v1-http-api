/* eslint-env mocha */

import { createDelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client'
import { createDelegatedRoutingV1HttpApiServer } from '@helia/delegated-routing-v1-http-api-server'
import { expect } from 'aegir/chai'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { createHelia } from './fixtures/create-helia.js'
import type { Helia } from '@helia/interface'
import type { DelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client'
import type { Libp2p } from '@libp2p/interface'
import type { KadDHT } from '@libp2p/kad-dht'
import type { FastifyInstance } from 'fastify'

describe('routing-v1-http-api interop', () => {
  let network: Array<Helia<Libp2p<{ dht: KadDHT }>>>
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
  })

  afterEach(async () => {
    if (client != null) {
      client.stop()
    }

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
})
