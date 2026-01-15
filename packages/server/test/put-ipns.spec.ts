import { generateKeyPair } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import { expect } from 'aegir/chai'
import { createIPNSRecord, marshalIPNSRecord, multihashToIPNSRoutingKey } from 'ipns'
import { CID } from 'multiformats'
import { stubInterface } from 'sinon-ts'
import { createDelegatedRoutingV1HttpApiServer } from '../src/index.js'
import type { Helia } from '@helia/interface'
import type { FastifyInstance } from 'fastify'
import type { StubbedInstance } from 'sinon-ts'

describe('put IPNS', () => {
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
