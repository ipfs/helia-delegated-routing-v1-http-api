/* eslint-env mocha */

import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { expect } from 'aegir/chai'
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
      Protocol: 'transport-bitswap',
      Schema: 'bitswap',
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
      id: prov.id.toString(),
      addrs: prov.multiaddrs.map(ma => ma.toString())
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
})
