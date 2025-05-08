import { NotFoundError } from '@libp2p/interface'
import { marshalIPNSRecord, multihashFromIPNSRoutingKey, unmarshalIPNSRecord } from 'ipns'
import first from 'it-first'
import map from 'it-map'
import { CID } from 'multiformats/cid'
import { equals as uint8ArrayEquals } from 'uint8arrays/equals'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import type { DelegatedRoutingV1HttpApiClient } from './index.js'
import type { ContentRouting, PeerRouting, AbortOptions, PeerId, PeerInfo } from '@libp2p/interface'

const IPNS_PREFIX = uint8ArrayFromString('/ipns/')

function isIPNSKey (key: Uint8Array): boolean {
  return uint8ArrayEquals(key.subarray(0, IPNS_PREFIX.byteLength), IPNS_PREFIX)
}

/**
 * Wrapper class to convert [http-routing-v1 content events](https://specs.ipfs.tech/routing/http-routing-v1/#response-body) into returned values
 */
export class DelegatedRoutingV1HttpApiClientContentRouting implements ContentRouting {
  private readonly client: DelegatedRoutingV1HttpApiClient

  constructor (client: DelegatedRoutingV1HttpApiClient) {
    this.client = client
  }

  async * findProviders (cid: CID, options: AbortOptions = {}): AsyncIterable<PeerInfo> {
    yield * map(this.client.getProviders(cid, options), (record) => {
      return {
        id: record.ID,
        multiaddrs: record.Addrs ?? []
      }
    })
  }

  async provide (): Promise<void> {
    // noop
  }

  async cancelReprovide (): Promise<void> {
    // noop
  }

  async put (key: Uint8Array, value: Uint8Array, options?: AbortOptions): Promise<void> {
    if (!isIPNSKey(key)) {
      return
    }

    const digest = multihashFromIPNSRoutingKey(key)
    const cid = CID.createV1(0x72, digest)
    const record = unmarshalIPNSRecord(value)

    await this.client.putIPNS(cid, record, options)
  }

  async get (key: Uint8Array, options?: AbortOptions): Promise<Uint8Array> {
    if (!isIPNSKey(key)) {
      throw new NotFoundError('Not found')
    }

    const digest = multihashFromIPNSRoutingKey(key)
    const cid = CID.createV1(0x72, digest)

    try {
      const record = await this.client.getIPNS(cid, options)

      return marshalIPNSRecord(record)
    } catch (err: any) {
      // BadResponseError is thrown when the response had no body, which means
      // the record couldn't be found
      if (err.name === 'BadResponseError') {
        throw new NotFoundError('Not found')
      }

      throw err
    }
  }
}

/**
 * Wrapper class to convert [http-routing-v1](https://specs.ipfs.tech/routing/http-routing-v1/#response-body-0) events into expected libp2p values
 */
export class DelegatedRoutingV1HttpApiClientPeerRouting implements PeerRouting {
  private readonly client: DelegatedRoutingV1HttpApiClient

  constructor (client: DelegatedRoutingV1HttpApiClient) {
    this.client = client
  }

  async findPeer (peerId: PeerId, options: AbortOptions = {}): Promise<PeerInfo> {
    const peer = await first(this.client.getPeers(peerId, options))

    if (peer != null) {
      return {
        id: peer.ID,
        multiaddrs: peer.Addrs ?? []
      }
    }

    throw new NotFoundError('Not found')
  }

  async * getClosestPeers (key: Uint8Array, options: AbortOptions = {}): AsyncIterable<PeerInfo> {
    // noop
  }
}
