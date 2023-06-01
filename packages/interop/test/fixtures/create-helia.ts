import { kadDHT } from '@libp2p/kad-dht'
import { createHelia as createNode, type HeliaInit } from 'helia'
import { identifyService } from 'libp2p/identify'
import type { Helia } from '@helia/interface'
import type { Libp2p } from '@libp2p/interface-libp2p'
import type { KadDHT } from '@libp2p/kad-dht'

export async function createHelia (init?: Partial<HeliaInit>): Promise<Helia<Libp2p<{ dht: KadDHT, identify: unknown }>>> {
  const helia = await createNode({
    libp2p: {
      peerDiscovery: [],
      services: {
        identify: identifyService(),
        dht: kadDHT()
      }
    }
  })

  // @ts-expect-error cannot derive service map type
  return helia
}
