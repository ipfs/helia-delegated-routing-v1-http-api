import { identify } from '@libp2p/identify'
import { kadDHT, removePublicAddressesMapper } from '@libp2p/kad-dht'
import { keychain } from '@libp2p/keychain'
import { ping } from '@libp2p/ping'
import { createHelia as createNode } from 'helia'
import { ipnsSelector } from 'ipns/selector'
import { ipnsValidator } from 'ipns/validator'
import type { Libp2p } from '@libp2p/interface'
import type { KadDHT } from '@libp2p/kad-dht'
import type { Keychain } from '@libp2p/keychain'
import type { HeliaInit, Helia } from 'helia'

export async function createHelia (init?: Partial<HeliaInit>): Promise<Helia<Libp2p<{ dht: KadDHT, keychain: Keychain }>>> {
  const helia = await createNode({
    libp2p: {
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
    }
  })

  // @ts-expect-error cannot derive service map type
  return helia
}
