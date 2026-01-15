import { generateKeyPair } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import { expect } from 'aegir/chai'
import { createIPNSRecord, marshalIPNSRecord } from 'ipns'
import { CID } from 'multiformats'
import { stubInterface } from 'sinon-ts'
import { createDelegatedRoutingV1HttpApiServer } from '../src/index.js'
import type { Helia } from '@helia/interface'
import type { FastifyInstance } from 'fastify'
import type { StubbedInstance } from 'sinon-ts'

describe('get IPNS', () => {
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

  it('GET ipns returns 200 with text/plain if record is not found', async () => {
    const peerId = peerIdFromPrivateKey(await generateKeyPair('Ed25519'))

    helia.routing.get = async function () {
      const error = new Error('Not found')
      // @ts-expect-error - code property not on Error
      error.code = 'ERR_NOT_FOUND'
      throw error
    }

    const res = await fetch(`${url}routing/v1/ipns/${peerId.toCID().toString()}`, {
      method: 'GET',
      headers: {
        accept: 'application/vnd.ipfs.ipns-record'
      }
    })

    expect(res.status).to.equal(200)
    expect(res.headers.get('content-type')).to.equal('text/plain; charset=utf-8')
    const text = await res.text()
    expect(text).to.equal('Record not found')
  })
})
