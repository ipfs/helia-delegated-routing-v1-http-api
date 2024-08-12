## 1.0.0 (2024-06-20)


### ⚠ BREAKING CHANGES

* returns IPNS objects are from ipns@9.x.x
* bump multiformats from 12.1.3 to 13.0.0 (#75)
* method signatures have changed to be closer to the delegated http routing v1 API spec

### Features

* add support for libp2p ContentRouting and PeerRouting ([#44](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/44)) ([ddfff1b](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/ddfff1b0e9c5d58042841bdf3ba78ddef00dbcaf))
* allow skipping IPNS record validation ([#101](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/101)) ([ec0ba89](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/ec0ba898cbe6e839eda7ffc03c672cbaf7fcc4f6))
* initial import ([d49fff6](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/d49fff63e425917854b81ec0b7dda45c190db753))


### Bug Fixes

* add CORS plugin ([5913f9d](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/5913f9d656da0ab540e5238088394ca8ff44c2f4))
* conform to Delegated Routing V1 HTTP spec ([#41](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/41)) ([41e7902](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/41e790273f568d0ac939f97d4ff1b1a877345930))
* conform to peer schema ([35f47da](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/35f47da0fc9e1db440894a5f213a6d5365716383))
* handle unparsable peer ids ([#118](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/118)) ([9bdbe46](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/9bdbe469577edda28e81f1799085cd1b49391331))
* increase listeners to silence node warnings ([#112](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/112)) ([13f4084](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/13f408422422e132f8c00f02108f87cf9ea01bb1))
* increase shutdown controller signal listeners ([#62](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/62)) ([ab7afa7](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/ab7afa7933eaed61dec9c82d8ac056ee11911436))
* mark package as side-effect free ([551e0f2](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/551e0f230d0d53fece38c4bc652dbb827a67c87f))
* PeerRecord Addrs and Protocols do not need to be optional ([#43](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/43)) ([ec62768](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/ec62768fac9e556314219cc66432aae9624fb5f1))
* remove @helia/interface dep ([#59](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/59)) ([aa8ffb8](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/aa8ffb87bbfedba43f3bf201fe6c2a41221731da))


### Trivial Changes

* add or force update .github/workflows/js-test-and-release.yml ([#19](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/19)) ([1af4a7a](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/1af4a7af14c6a177177613917c39b7b4438f25c2))
* add project field to eslint config ([#40](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/40)) ([7dac713](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/7dac7133c3f6d3dcaf918080281c87d5c6fe9dd1))
* add typedoc entry point ([5b16a12](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/5b16a125624dec9881023ad65b05ad7b52e4e524))
* delete templates [skip ci] ([#18](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/18)) ([e1771ee](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/e1771ee42889b06590f1c6915d7dc43266078e9b))
* fix deps ([9aa177d](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/9aa177d038cc30bb6949624c8cc9266cc77364db))
* fix package name ([841d8f1](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/841d8f16f9a60774714601dc20f4beeb9af3dff8))
* fix package name ([cd172da](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/cd172da90de405c33cfe520f0671e7a582badd15))
* fix package name ([2c13d74](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/2c13d74b8bb107c8fef2997eb631e81ecb7190d2))
* **release:** 1.0.0 [skip ci] ([a5b8290](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/a5b829016b66df384aa334604e61222ded51de3e)), closes [#41](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/41) [#40](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/40) [#26](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/26) [#8](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/8) [#39](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/39) [#26](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/26) [#8](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/8) [#39](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/39) [#42](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/42)
* **release:** 1.0.0 [skip ci] ([b027b54](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/b027b540188ac27dd32e02c5f4d4715c741e483c)), closes [#41](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/41) [#40](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/40) [#26](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/26) [#8](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/8) [#39](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/39) [#26](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/26) [#8](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/8) [#39](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/39)
* **release:** 1.0.0 [skip ci] ([fd4871b](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/fd4871bfbb8c6f8c22a1314420bde0e62ee5fb77))
* **release:** 1.0.0 [skip ci] ([867feb8](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/867feb8d9d1531076740daf4271f29a198686796))
* **release:** 1.0.0 [skip ci] ([ed31f44](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/ed31f447f4a10914c44eb069a52c542da6014cbe))
* **release:** 1.0.1 [skip ci] ([39c92a5](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/39c92a5bb0055aabff9b2b11b184cdde5abff138)), closes [#47](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/47)
* **release:** 1.0.1 [skip ci] ([58d76be](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/58d76bed45a7c9f6385ac3f8f0ad78f7acfb22ff)), closes [#43](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/43)
* **release:** 1.0.1 [skip ci] ([7d3d708](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/7d3d708b7e053049996404403e13357f0af8cf7e)), closes [#26](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/26) [#8](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/8)
* **release:** 1.0.1 [skip ci] ([4a7be80](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/4a7be8072b41899195bacc733414855bf1a7866d))
* **release:** 1.0.2 [skip ci] ([4214634](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/4214634bf1d40595c30a48938cd616aa1fb3a5f0)), closes [#48](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/48)
* **release:** 1.0.2 [skip ci] ([8760907](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/87609076cbddb21591e845c5847593a2add95a7d)), closes [#39](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/39)
* **release:** 1.0.2 [skip ci] ([9b4b3e8](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/9b4b3e8e62e0f4311d44b286590815a50dde35d2)), closes [#26](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/26) [#8](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/8)
* **release:** 1.0.3 [skip ci] ([e8d3243](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/e8d32433fdee062cea1e105b498d2f0db41529c8)), closes [#49](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/49)
* **release:** 1.0.3 [skip ci] ([1aa75e3](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/1aa75e35fe04bc7fe39ac2c87d0d321eeb7248b8)), closes [#39](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/39)
* **release:** 1.0.4 [skip ci] ([7e2bb0b](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/7e2bb0befbdf8bee18213b90d6a074a4cc240aa2)), closes [#58](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/58)
* **release:** 1.0.5 [skip ci] ([5341fc1](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/5341fc125b6b8b52fe2379f1392286962fef0fa4)), closes [#59](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/59)
* **release:** 1.1.0 [skip ci] ([4f593ec](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/4f593ece28accda1f6f0e160ddcb3f21586a0911)), closes [#44](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/44) [#47](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/47)
* **release:** 1.1.1 [skip ci] ([9ab3df4](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/9ab3df41c74f6bbe985bee72aeeafe707291c226)), closes [#58](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/58)
* **release:** 1.1.2 [skip ci] ([1db87c0](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/1db87c03a16b6fe91d6e851c0242d916c687afa9)), closes [#62](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/62)
* **release:** 2.0.0 [skip ci] ([c9936ca](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/c9936ca034fa2e2de178286c242ba2ea1f6427aa)), closes [#75](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/75) [#100](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/100) [#75](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/75) [#94](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/94)
* **release:** 2.0.0 [skip ci] ([81281b6](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/81281b6d0ef6ee8afd637958cadddaea9d11978b)), closes [#75](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/75) [#100](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/100) [#75](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/75) [#73](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/73) [#77](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/77) [#94](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/94)
* **release:** 2.0.1 [skip ci] ([814f9ef](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/814f9ef65559a109377ecd85ac264bb4c06413b6)), closes [#91](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/91)
* **release:** 2.0.1 [skip ci] ([7e4f169](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/7e4f1697fed98a583f9e6f0db7312691fa5676e4)), closes [#91](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/91)
* **release:** 2.0.2 [skip ci] ([01f6b44](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/01f6b44b6bd2ef8aa1d07416ea279fdbda6792ce))
* **release:** 2.0.3 [skip ci] ([0fdea42](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/0fdea42cebf73855b157011434c281d8a1770f0b))
* **release:** 2.1.0 [skip ci] ([e3a2d8f](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/e3a2d8f25ea2d4e964f5f3e0233587e2f8b6544e)), closes [#101](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/101)
* **release:** 3.0.0 [skip ci] ([be52e79](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/be52e790b9aed9be586ccc02e64c8f47617569b3)), closes [#102](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/102)
* **release:** 3.0.0 [skip ci] ([d2624dc](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/d2624dc2bd747d77beab7d699e3bcbb9d59a3c88)), closes [#102](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/102)
* **release:** 3.0.1 [skip ci] ([a2f715a](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/a2f715a7f8b77fdc6a4a62cc222a8e8da2b0d9fa)), closes [#112](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/112)
* **release:** 3.0.1 [skip ci] ([5f2faf6](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/5f2faf6334550eb393f1e6c43d82459aea45ddc3)), closes [#104](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/104)
* **release:** 3.0.2 [skip ci] ([6933d34](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/6933d34bf25fc09fb985d6e221519745f85c30e5)), closes [#108](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/108)
* **release:** 3.0.3 [skip ci] ([bfbba0f](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/bfbba0fa7f44d666ecd6ee04996c6a0facac4c87)), closes [#112](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/112)
* remove extra ci file ([#46](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/46)) ([b130c17](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/b130c1757e025f87f89ee2d3d0af6bc97735ec6b))
* remove release from interop ([a3be11b](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/a3be11b359e53b12b73f554003f2f0fb243c1405))
* Update .github/pull_request_template.md [skip ci] ([c4fb76f](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/c4fb76fedb742166025afbc3ab9cfb9663911c59))
* Update .github/workflows/stale.yml [skip ci] ([30d5d80](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/30d5d8074c13dbc3e5b6f09c59f218e7861d9837))
* Update .github/workflows/stale.yml [skip ci] ([a958569](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/a95856909896a32a169cf73945e05e8305d67e80))
* Update .github/workflows/stale.yml [skip ci] ([b4f59b6](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/b4f59b698d36ba23911a39f6bdd01b2be14e8d3b))
* update aegir ([c7c81b5](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/c7c81b5004efae54a57dd513ed1b5d0520658238))
* update project config ([29bf459](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/29bf459aa63e15c4a0b20c202416b3c1a22fbd7b))
* update project config ([#100](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/100)) ([0bc6284](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/0bc628408563039b65010f76a9ffc2f4f3c5e270))
* update sibling dependencies ([0c21765](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/0c21765fffe7315ba74de75254b2ed43aded342b))
* update sibling dependencies ([85cc65e](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/85cc65ec5fcf64b7e28fa6ae5d7c785457991a60))
* update sibling dependencies ([3fcc332](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/3fcc33288d53525aaeb2ebe9d74782eb2f8983ee))
* update sibling dependencies ([1b5d5dc](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/1b5d5dcc717499fae21cbcd72e368a982a520508))


### Documentation

* update project config and readmes ([#47](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/47)) ([31eb6f7](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/31eb6f77c66a7e0e0e8f9a0b828dfbd70fbf5929))
* update readme examples to import correct symbols ([#58](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/58)) ([bcfc785](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/bcfc78563b8bfb549fdb070da3df36bfb601b7c7))
* update readmes and package descriptions ([11934bc](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/11934bc9c482b87e8303ea4393c49c7f1c029bd9))


### Dependencies

* bump @fastify/cors from 8.5.0 to 9.0.1 ([#108](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/108)) ([851b40f](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/851b40f29e17804a86969773bde3d8997c8628e5))
* bump @libp2p/interface from 0.1.6 to 1.1.1 ([#91](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/91)) ([50e4864](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/50e4864df6584dae794b8720c4f9516ee74790ff))
* bump helia from 1.3.12 to 2.0.1 ([#26](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/26)) ([9160281](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/9160281a11058a36ff03962fb89d575a88ac901c))
* bump multiformats from 12.1.3 to 13.0.0 ([#75](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/75)) ([1dabe16](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/1dabe16d06944e73015ef4289fb36353f74f1768))
* bump p-queue from 7.4.1 to 8.0.1 ([#73](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/73)) ([d575f73](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/d575f7374c64504940d5951c120551826b0a87e7))
* bump uint8arrays from 4.0.10 to 5.0.1 ([#77](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/77)) ([e966c99](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/e966c99fa1b369cae526e47523a4071a70627917))
* **dev:** bump @helia/ipns from 5.0.0 to 6.0.0 ([#107](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/107)) ([c4d9c8f](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/c4d9c8f906150dbe1157e95cc31545524e17ca82))
* **dev:** bump @helia/ipns from 6.0.1 to 7.1.0 ([#110](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/110)) ([bb10bf7](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/bb10bf7c93ea9a8f7c21268aa5711a1f11d6dca6))
* **dev:** bump @types/sinon from 10.0.20 to 17.0.0 ([#49](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/49)) ([c2d5bfb](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/c2d5bfb4fc7fb87f0bea7e0ca4c63ddf395bd05b))
* **dev:** bump aegir from 39.0.13 to 40.0.8 ([#8](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/8)) ([127bcc0](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/127bcc0ff509b57ee972ac949d48b579b7fe7f07))
* **dev:** bump aegir from 40.0.13 to 41.0.0 ([#39](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/39)) ([c01a33e](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/c01a33eecf137c6773cf9b34ca05c12f18d04b09))
* **dev:** bump aegir from 41.3.5 to 42.1.1 ([#94](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/94)) ([e34a142](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/e34a142f4aff8a9a5899f47a31b898f21a3c4b39))
* **dev:** bump helia from 3.0.1 to 4.0.0 ([#104](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/104)) ([23cd638](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/23cd638dc1a601bacaca63abb017567b1dbf4341))
* **dev:** bump sinon from 16.1.3 to 17.0.0 ([#42](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/42)) ([43275c0](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/43275c08ae0db55298aa9212b6755c8fb41264a3))
* **dev:** bump sinon-ts from 1.0.2 to 2.0.0 ([#48](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/48)) ([7e0c7d3](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/7e0c7d3484d115596bfa0690ea81cb62bc10477e))
* update ipns to v9 ([#102](https://github.com/ipfs/helia-delegated-routing-v1-http-api/issues/102)) ([1097cb6](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/1097cb6bd90741bf55d46f9c3e07bfa9f01f362b))
* update sibling dependencies ([c2f7470](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/c2f74702796965c0096a42fe29c9eaf124ff899d))
* update sibling dependencies ([7d9cb15](https://github.com/ipfs/helia-delegated-routing-v1-http-api/commit/7d9cb15f8d22e5bbfc549de64a7abc8d2ff15a3c))
