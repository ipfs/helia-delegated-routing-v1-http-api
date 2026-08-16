import { defaultLogger } from '@libp2p/logger'
import { expect } from 'aegir/chai'
import all from 'it-all'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import { raceSignal } from 'race-signal'
import { DelegatedRoutingV1HttpApiClient } from '../src/client.ts'
import { itBrowser } from './fixtures/it.ts'

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

  it('should shut down cleanly with requests in progress', async () => {
    const router = 'https://delegated-ipfs.dev'

    const client = new DelegatedRoutingV1HttpApiClient({
      logger: defaultLogger()
    }, {
      url: router
    })

    const p: Array<Promise<any>> = []

    for (let i = 0; i < 20; i++) {
      p.push(all(client.getProviders(await randomCID())))
    }

    p.push(client.stop())

    await raceSignal(Promise.allSettled(p), AbortSignal.timeout(5_000))
  })
})

async function randomCID (): Promise<CID> {
  const random = crypto.getRandomValues(new Uint8Array(32))

  return CID.createV1(0x55, await sha256.digest(random))
}
