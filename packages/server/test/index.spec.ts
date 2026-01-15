import { expect } from 'aegir/chai'
import { stubInterface } from 'sinon-ts'
import { createDelegatedRoutingV1HttpApiServer } from '../src/index.js'
import type { Helia } from '@helia/interface'
import type { FastifyInstance } from 'fastify'
import type { StubbedInstance } from 'sinon-ts'

describe('delegated-routing-v1-http-api-server', () => {
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

  it('supports CORS', async () => {
    const res = await fetch(`${url}routing/v1/providers/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn`, {
      method: 'OPTIONS'
    })

    expect(res.headers.get('access-control-allow-origin')).to.equal('*')
    expect(res.headers.get('access-control-allow-methods')).to.equal('GET, OPTIONS')
  })
})
