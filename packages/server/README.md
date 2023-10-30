<p align="center">
  <a href="https://github.com/ipfs/helia" title="Helia">
    <img src="https://raw.githubusercontent.com/ipfs/helia/main/assets/helia.png" alt="Helia logo" width="300" />
  </a>
</p>

[![ipfs.tech](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](https://ipfs.tech)
[![Discuss](https://img.shields.io/discourse/https/discuss.ipfs.tech/posts.svg?style=flat-square)](https://discuss.ipfs.tech)
[![codecov](https://img.shields.io/codecov/c/github/ipfs/helia-delegated-routing-v1-http-api.svg?style=flat-square)](https://codecov.io/gh/ipfs/helia-delegated-routing-v1-http-api)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs/helia-delegated-routing-v1-http-api/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/ipfs/helia-delegated-routing-v1-http-api/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> A Delegated Routing V1 HTTP API server powered by Helia

## About

Implements HTTP routes for a Fastify server that conform to the [Routing V1 HTTP API](https://specs.ipfs.tech/routing/http-routing-v1/).

### Example

```typescript
import { createHelia } from 'helia'
import { createRoutingV1HttpApiServer } from '@helia/routing-v1-http-api-server'

const helia = await createHelia()
const server = await createRoutingV1HttpApiServer(helia, {
  listen: {
    // fastify listen options
  }
})

// now make http requests
```

Alternatively if you have a Fastify instance already you can add routes to it.
,

### Example

```typescript
import fastify from 'fastify'
import cors from '@fastify/cors'
import { createHelia } from 'helia'
import routes from '@helia/routing-v1-http-api-server/routes'

const server = fastify({
 // fastify options
})
await server.register(cors, {
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  strictPreflight: false
})

const helia = await createHelia()

// configure Routing V1 HTTP API routes
routes(server, helia)

await server.listen({
  // fastify listen options
})

// now make http requests
```

## Install

```console
$ npm i @helia/delegated-routing-v1-http-api-server
```

## API Docs

- <https://ipfs.github.io/helia-delegated-routing-v1-http-api/modules/_helia_delegated_routing_v1_http_api_server.html>

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribute

Contributions welcome! Please check out [the issues](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues).

Also see our [contributing document](https://github.com/ipfs/community/blob/master/CONTRIBUTING_JS.md) for more information on how we work, and about contributing in general.

Please be aware that all interactions related to this repo are subject to the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)
