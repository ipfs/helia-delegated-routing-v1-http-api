<p align="center">
  <a href="https://github.com/ipfs/helia" title="Helia">
    <img src="https://raw.githubusercontent.com/ipfs/helia/main/assets/helia.png" alt="Helia logo" width="300" />
  </a>
</p>

# @helia/delegated-routing-v1-http-api-client

[![ipfs.tech](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](https://ipfs.tech)
[![Discuss](https://img.shields.io/discourse/https/discuss.ipfs.tech/posts.svg?style=flat-square)](https://discuss.ipfs.tech)
[![codecov](https://img.shields.io/codecov/c/github/ipfs/helia-delegated-routing-v1-http-api.svg?style=flat-square)](https://codecov.io/gh/ipfs/helia-delegated-routing-v1-http-api)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs/helia-delegated-routing-v1-http-api/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/ipfs/helia-delegated-routing-v1-http-api/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> A Delegated Routing V1 HTTP API client

# About

<!--

!IMPORTANT!

Everything in this README between "# About" and "# Install" is automatically
generated and will be overwritten the next time the doc generator is run.

To make changes to this section, please update the @packageDocumentation section
of src/index.js or src/index.ts

To experiment with formatting, please run "npm run docs" from the root of this
repo and examine the changes made.

-->

A client implementation of the IPFS [Delegated Routing V1 HTTP API](https://specs.ipfs.tech/routing/http-routing-v1/) that can be used to interact with any compliant server implementation.

## Example

```typescript
import { createDelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client'
import { CID } from 'multiformats/cid'

const client = createDelegatedRoutingV1HttpApiClient('https://example.org')

for await (const prov of getProviders(CID.parse('QmFoo'))) {
  // ...
}
```

### How to use with libp2p

The client can be configured as a libp2p service, this will enable it as both a ContentRouting and a PeerRouting implementation

## Example

```typescript
import { createDelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client'
import { createLibp2p } from 'libp2p'
import { peerIdFromString } from '@libp2p/peer-id'

const client = createDelegatedRoutingV1HttpApiClient('https://example.org')
const libp2p = await createLibp2p({
  // other config here
  services: {
    delegatedRouting: client
  }
})

// later this will use the configured HTTP gateway
await libp2p.peerRouting.findPeer(peerIdFromString('QmFoo'))
```

### Filtering with IPIP-484

The client can be configured to pass filter options to the delegated routing server as defined in IPIP-484.
The filter options be set globally, by passing them to the client constructor, or on a per-request basis.

## Example

```typescript
import { createDelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client'
import { createLibp2p } from 'libp2p'
import { peerIdFromString } from '@libp2p/peer-id'

// globally set filter options
const client = createDelegatedRoutingV1HttpApiClient('https://delegated-ipfs.dev', {
  filterProtocols: ['transport-bitswap', 'unknown', 'transport-ipfs-gateway-http'],
  filterAddrs: ['webtransport', 'webrtc-direct', 'wss']
})

// per-request filter options
for await (const prov of getProviders(CID.parse('bafy'), {
  filterProtocols: ['transport-ipfs-gateway-http'],
  filterAddrs: ['!p2p-circuit']
})) {
  // ...
}
```

# Install

```console
$ npm i @helia/delegated-routing-v1-http-api-client
```

# API Docs

- <https://ipfs.github.io/helia-delegated-routing-v1-http-api/modules/_helia_delegated_routing_v1_http_api_client.html>

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](https://github.com/ipfs/helia-delegated-routing-v1-http-api/blob/main/packages/client/LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](https://github.com/ipfs/helia-delegated-routing-v1-http-api/blob/main/packages/client/LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribute

Contributions welcome! Please check out [the issues](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues).

Also see our [contributing document](https://github.com/ipfs/community/blob/master/CONTRIBUTING_JS.md) for more information on how we work, and about contributing in general.

Please be aware that all interactions related to this repo are subject to the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)
