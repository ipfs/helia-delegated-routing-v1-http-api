import { withLibp2p } from '@helia/libp2p'
import { identify } from '@libp2p/identify'
import { kadDHT, removePublicAddressesMapper } from '@libp2p/kad-dht'
import { keychain } from '@libp2p/keychain'
import { ping } from '@libp2p/ping'
import { createHeliaLight } from 'helia'
import { ipnsSelector } from 'ipns/selector'
import { ipnsValidator } from 'ipns/validator'
import type { HeliaWithLibp2p } from '@helia/libp2p'
import type { KadDHT } from '@libp2p/kad-dht'
import type { Keychain } from '@libp2p/keychain'
import type { HeliaInit } from 'helia'

export async function createHelia (init?: Partial<HeliaInit>): Promise<HeliaWithLibp2p<{ dht: KadDHT, keychain: Keychain }>> {
  const helia = await withLibp2p(createHeliaLight(), {
    peerDiscovery: [],
    services: {
      dht: kadDHT({
        protocol: '/ipfs/lan/kad/1.0.0',
        peerInfoMapper: removePublicAddressesMapper,
        clientMode: false,
        validators: {
          ipns: ipnsValidator
        },
        selectors: {
          ipns: ipnsSelector
        }
      }),
      identify: identify(),
      ping: ping(),
      keychain: keychain()
    }
  }).start()

  return helia
}
