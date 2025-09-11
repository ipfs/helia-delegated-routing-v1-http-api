import { identify } from '@libp2p/identify'
import { kadDHT, removePublicAddressesMapper } from '@libp2p/kad-dht'
import { ping } from '@libp2p/ping'
import { createHelia as createNode } from 'helia'
import { ipnsSelector } from 'ipns/selector'
import { ipnsValidator } from 'ipns/validator'
import type { HeliaInit, HeliaLibp2p } from 'helia'

export async function createHelia (init?: Partial<HeliaInit>): Promise<HeliaLibp2p> {
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
        ping: ping()
      }
    }
  })

  return helia
}
