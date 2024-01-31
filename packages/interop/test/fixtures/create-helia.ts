import { identify } from '@libp2p/identify'
import { kadDHT, removePublicAddressesMapper, type KadDHT } from '@libp2p/kad-dht'
import { createHelia as createNode, type HeliaInit, type HeliaLibp2p } from 'helia'
import { ipnsSelector } from 'ipns/selector'
import { ipnsValidator } from 'ipns/validator'
import type { Libp2p } from '@libp2p/interface'

export async function createHelia (init?: Partial<HeliaInit>): Promise<HeliaLibp2p<Libp2p<{ dht: KadDHT }>>> {
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
        identify: identify()
      }
    }
  })

  // @ts-expect-error cannot derive service map type
  return helia
}
