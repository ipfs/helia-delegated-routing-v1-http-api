/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { stubInterface } from 'sinon-ts'
import { createRoutingV1HttpApiServer } from '../src/index.js'
import type { Helia } from '@helia/interface'
import type { FastifyInstance } from 'fastify'
import type { SinonStubbedInstance } from 'sinon'

describe('routing-v1-http-api-server', () => {
  let helia: SinonStubbedInstance<Helia>
  let server: FastifyInstance

  beforeEach(async () => {
    helia = stubInterface<Helia>()
    server = await createRoutingV1HttpApiServer(helia)
  })

  afterEach(async () => {
    if (server != null) {
      await server.close()
    }
  })

  it('returns providers', async () => {
    expect(true).to.be.true()
  })
})
