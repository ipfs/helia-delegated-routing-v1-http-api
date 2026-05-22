import { contentRoutingSymbol, NotFoundError, peerRoutingSymbol } from '@libp2p/interface'
import first from 'it-first'
import map from 'it-map'
import { digest } from 'multiformats'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import * as Digest from 'multiformats/hashes/digest'
import { identity } from 'multiformats/hashes/identity'
import { equals as uint8ArrayEquals } from 'uint8arrays/equals'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import type { DelegatedRoutingV1HttpApiClient } from './index.ts'
import type { ContentRouting, PeerRouting, AbortOptions, PeerId, PeerInfo, Provider, Startable } from '@libp2p/interface'

const IPNS_PREFIX = uint8ArrayFromString('/ipns/')

function isIPNSKey (key: Uint8Array): boolean {
  return uint8ArrayEquals(key.subarray(0, IPNS_PREFIX.byteLength), IPNS_PREFIX)
}

/**
 * Wrapper class to convert [http-routing-v1 content events](https://specs.ipfs.tech/routing/http-routing-v1/#response-body) into returned values
 */
export class DelegatedRoutingV1HttpApiClientContentRouting implements ContentRouting, Startable {
  private readonly client: DelegatedRoutingV1HttpApiClient

  constructor (client: DelegatedRoutingV1HttpApiClient) {
    this.client = client
  }

  get [contentRoutingSymbol] (): ContentRouting {
    return this
  }

  async start (): Promise<void> {
    await this.client.start()
  }

  async stop (): Promise<void> {
    await this.client.stop()
  }

  async * findProviders (cid: CID, options: AbortOptions = {}): AsyncIterable<Provider> {
    try {
      yield * map(this.client.getProviders(cid, options), (record) => {
        return {
          id: record.ID,
          multiaddrs: record.Addrs ?? [],
          routing: 'delegated-http-routing-v1'
        }
      })
    } catch (err) {
      // NotFoundError means no providers were found so end the iterator instead
      // of throwing which means there was an error
      if (err instanceof NotFoundError) {
        return
      }

      throw err
    }
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

    const digest = Digest.decode(key.slice(IPNS_PREFIX.length))
    const cid = CID.createV1(0x72, digest)

    await this.client.putIPNS(cid, value, options)
  }

  async get (key: Uint8Array, options?: AbortOptions): Promise<Uint8Array> {
    if (!isIPNSKey(key)) {
      throw new NotFoundError('Not found')
    }

    const digest = Digest.decode(key.slice(IPNS_PREFIX.length))
    const cid = CID.createV1(0x72, digest)

    try {
      return await this.client.getIPNS(cid, options)
    } catch (err: any) {
      // BadResponseError is thrown when the response had no body, which means
      // the record couldn't be found
      if (err.name === 'BadResponseError') {
        throw new NotFoundError('Not found')
      }

      throw err
    }
  }

  toString (): string {
    return `DelegatedRoutingV1HttpApiClientContentRouting(${this.client.url})`
  }
}

/**
 * Wrapper class to convert [http-routing-v1](https://specs.ipfs.tech/routing/http-routing-v1/#response-body-0) events into expected libp2p values
 */
export class DelegatedRoutingV1HttpApiClientPeerRouting implements PeerRouting, Startable {
  private readonly client: DelegatedRoutingV1HttpApiClient

  constructor (client: DelegatedRoutingV1HttpApiClient) {
    this.client = client
  }

  get [peerRoutingSymbol] (): PeerRouting {
    return this
  }

  async start (): Promise<void> {
    await this.client.start()
  }

  async stop (): Promise<void> {
    await this.client.stop()
  }

  async findPeer (peerId: PeerId, options: AbortOptions = {}): Promise<PeerInfo> {
    const peer = await first(this.client.getPeers(peerId.toCID(), options))

    if (peer != null) {
      return {
        id: peer.ID,
        multiaddrs: peer.Addrs ?? []
      }
    }

    throw new NotFoundError('Not found')
  }

  async * getClosestPeers (key: Uint8Array, options: AbortOptions = {}): AsyncIterable<PeerInfo> {
    let cid: CID

    try {
      cid = CID.decode(key)
    } catch {
      try {
        cid = CID.createV1(0x72, digest.decode(key))
      } catch {
        cid = CID.createV1(raw.code, identity.digest(key))
      }
    }

    for await (const peer of this.client.getClosestPeers(cid, options)) {
      yield {
        id: peer.ID,
        multiaddrs: peer.Addrs ?? []
      }
    }
  }

  toString (): string {
    return `DelegatedRoutingV1HttpApiClientPeerRouting(${this.client.url})`
  }
}
