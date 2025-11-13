import { defaultLogger } from '@libp2p/logger'
import { expect } from 'aegir/chai'
import { DelegatedRoutingV1HttpApiClient } from '../src/client.js'
import { itBrowser } from './fixtures/it.js'

describe('client', () => {
  itBrowser('should remove cache on stop', async function () {
    const cacheName = 'test-cache'

    const client = new DelegatedRoutingV1HttpApiClient({
      logger: defaultLogger()
    }, {
      url: 'http://example.com',
      cacheName
    })
    await client.start()
    await client.stop()

    await expect(globalThis.caches.has(cacheName)).to.eventually.be.false('did not remove cache on stop')
  })
})
