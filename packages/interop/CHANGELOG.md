## @helia/delegated-routing-v1-http-api-interop-v1.0.0 (2024-09-15)

### ⚠ BREAKING CHANGES

* upgrade to Helia 5.x.x and libp2p 2.x.x
* returns IPNS objects are from ipns@9.x.x
* bump multiformats from 12.1.3 to 13.0.0 (#75)
* method signatures have changed to be closer to the delegated http routing v1 API spec

### Features

* initial import ([d49fff6](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/d49fff63e425917854b81ec0b7dda45c190db753))

### Bug Fixes

* add CORS plugin ([5913f9d](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/5913f9d656da0ab540e5238088394ca8ff44c2f4))
* conform to Delegated Routing V1 HTTP spec ([#41](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/41)) ([41e7902](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/41e790273f568d0ac939f97d4ff1b1a877345930))
* handle unparsable peer ids ([#118](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/118)) ([9bdbe46](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/9bdbe469577edda28e81f1799085cd1b49391331))
* PeerRecord Addrs and Protocols do not need to be optional ([#43](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/43)) ([ec62768](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/ec62768fac9e556314219cc66432aae9624fb5f1))

### Trivial Changes

* add project field to eslint config ([#40](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/40)) ([7dac713](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/7dac7133c3f6d3dcaf918080281c87d5c6fe9dd1))
* add typedoc entry point ([5b16a12](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/5b16a125624dec9881023ad65b05ad7b52e4e524))
* fix deps ([9aa177d](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/9aa177d038cc30bb6949624c8cc9266cc77364db))
* fix package name ([841d8f1](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/841d8f16f9a60774714601dc20f4beeb9af3dff8))
* fix package name ([cd172da](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/cd172da90de405c33cfe520f0671e7a582badd15))
* fix package name ([2c13d74](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/2c13d74b8bb107c8fef2997eb631e81ecb7190d2))
* **release:** 1.0.0 [skip ci] ([fd4871b](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/fd4871bfbb8c6f8c22a1314420bde0e62ee5fb77))
* remove release from interop ([a3be11b](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/a3be11b359e53b12b73f554003f2f0fb243c1405))
* update aegir ([c7c81b5](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/c7c81b5004efae54a57dd513ed1b5d0520658238))
* update sibling dependencies ([3fcc332](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/3fcc33288d53525aaeb2ebe9d74782eb2f8983ee))
* update sibling dependencies ([1b5d5dc](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/1b5d5dcc717499fae21cbcd72e368a982a520508))

### Documentation

* update project config and readmes ([#47](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/47)) ([31eb6f7](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/31eb6f77c66a7e0e0e8f9a0b828dfbd70fbf5929))
* update readmes and package descriptions ([11934bc](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/11934bc9c482b87e8303ea4393c49c7f1c029bd9))

### Dependencies

* bump @libp2p/interface from 0.1.6 to 1.1.1 ([#91](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/91)) ([50e4864](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/50e4864df6584dae794b8720c4f9516ee74790ff))
* bump helia from 1.3.12 to 2.0.1 ([#26](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/26)) ([9160281](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/9160281a11058a36ff03962fb89d575a88ac901c))
* bump multiformats from 12.1.3 to 13.0.0 ([#75](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/75)) ([1dabe16](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/1dabe16d06944e73015ef4289fb36353f74f1768))
* **dev:** bump @helia/ipns from 5.0.0 to 6.0.0 ([#107](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/107)) ([c4d9c8f](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/c4d9c8f906150dbe1157e95cc31545524e17ca82))
* **dev:** bump @helia/ipns from 6.0.1 to 7.1.0 ([#110](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/110)) ([bb10bf7](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/bb10bf7c93ea9a8f7c21268aa5711a1f11d6dca6))
* **dev:** bump aegir from 39.0.13 to 40.0.8 ([#8](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/8)) ([127bcc0](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/127bcc0ff509b57ee972ac949d48b579b7fe7f07))
* **dev:** bump aegir from 40.0.13 to 41.0.0 ([#39](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/39)) ([c01a33e](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/c01a33eecf137c6773cf9b34ca05c12f18d04b09))
* **dev:** bump aegir from 41.3.5 to 42.1.1 ([#94](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/94)) ([e34a142](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/e34a142f4aff8a9a5899f47a31b898f21a3c4b39))
* **dev:** bump aegir from 43.0.3 to 44.1.1 ([#125](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/125)) ([d01f77b](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/d01f77b4c751e076fec0a1d99d2614a6427ff140))
* **dev:** bump helia from 3.0.1 to 4.0.0 ([#104](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/104)) ([23cd638](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/23cd638dc1a601bacaca63abb017567b1dbf4341))
* update ipns to v9 ([#102](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/102)) ([1097cb6](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/1097cb6bd90741bf55d46f9c3e07bfa9f01f362b))
* update sibling dependencies ([c2f7470](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/c2f74702796965c0096a42fe29c9eaf124ff899d))
* update sibling dependencies ([7d9cb15](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/7d9cb15f8d22e5bbfc549de64a7abc8d2ff15a3c))
* upgrade to Helia 5.x.x and libp2p 2.x.x ([27101f3](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/27101f309a66244d1790c926be4c54225534e361))

## @helia/routing-v1-http-api-interop-v1.0.0 (2023-06-01)


### Documentation

* update readmes and package descriptions ([11934bc](https://github.com/ipfs/helia-routing-v1-http-api/commit/11934bc9c482b87e8303ea4393c49c7f1c029bd9))


### Trivial Changes

* fix deps ([9aa177d](https://github.com/ipfs/helia-routing-v1-http-api/commit/9aa177d038cc30bb6949624c8cc9266cc77364db))


### Dependencies

* update sibling dependencies ([c2f7470](https://github.com/ipfs/helia-routing-v1-http-api/commit/c2f74702796965c0096a42fe29c9eaf124ff899d))
* update sibling dependencies ([7d9cb15](https://github.com/ipfs/helia-routing-v1-http-api/commit/7d9cb15f8d22e5bbfc549de64a7abc8d2ff15a3c))
