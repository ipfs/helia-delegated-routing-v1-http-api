import EchoServer from 'aegir/echo-server'
import body from 'body-parser'

// Special test CIDs that trigger specific fixtures
const TEST_CIDS = {
  // Providers endpoint test CIDs
  PROVIDERS_404: 'bafkreig3o4e7r4bpsc3hqirlzjeuie3w25tfjgmp6ufeaabwvuial3r4h4', // return404providers
  PROVIDERS_NULL: 'bafkreicyicgkpqid2qs3kfc277f4tsx5tew3e63fgv7fn6t74sicjkv76i', // returnnullproviders

  // Peers endpoint test CIDs (libp2p-key format)
  PEERS_404: 'k2k4r8pqu6ui9p0d0fewul7462tsb0pa57pi238gunrjxpfrg6zawrho', // return404peers
  PEERS_NULL: 'k2k4r8nyb48mv6n6olsob1zsz77mhdrvwtjcryjil2qqqzye5jds4uur', // returnnullpeers

  // IPNS endpoint test CIDs (libp2p-key format)
  IPNS_404: 'k2k4r8o3937xct4wma8gooitiip4mik0phkg8kt3b5x9y93a9dntvwjz', // return404ipns
  IPNS_JSON: 'k2k4r8pajj9txni0h9nv9gxuj1mju4jmi94iq2r4jwhxk87hnuo94yom', // returnjsonipns
  IPNS_HTML: 'k2k4r8kddkyieizgq7a32d9jc4nm99yupniet962vssrm34hamolquzk', // returnhtmlipns
  IPNS_NO_CONTENT_TYPE: 'k2k4r8okqrya8gr449btdy5b6vw0q68dh7y3fps9qbi0zmcmybz7bjpu' // returnnocontentipns
}

/** @type {import('aegir').PartialOptions} */
const options = {
  test: {
    before: async () => {
      let callCount = 0
      let lastCalledUrl = ''
      const providers = new Map()
      const peers = new Map()
      const ipnsGet = new Map()
      const ipnsPut = new Map()
      const echo = new EchoServer()
      echo.polka.use(body.raw({ type: 'application/vnd.ipfs.ipns-record'}))
      echo.polka.use(body.text())
      echo.polka.use(body.json())
      echo.polka.use((req, res, next) => {
        next()
        lastCalledUrl = req.url
      })
      echo.polka.post('/add-providers/:cid', (req, res) => {
        callCount++
        try {
          // if request body content-type was json it's already been parsed
          const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

          if (!Array.isArray(data.Providers)) {
            throw new Error('Data must be { Providers: [] }')
          }

          providers.set(req.params.cid, data)
          res.end(JSON.stringify({ success: true }))
        } catch (err) {
          console.error('Error in add-providers:', err)
          res.statusCode = 400
          res.end(JSON.stringify({
            error: err.message,
            code: 'ERR_INVALID_INPUT'
          }))
          providers.delete(req.params.cid)
        }
      })
      echo.polka.get('/routing/v1/providers/:cid', (req, res) => {
        callCount++
        try {
          const providerData = providers.get(req.params.cid)

          // Support testing 404 responses for backward compatibility
          if (req.params.cid === TEST_CIDS.PROVIDERS_404) {
            res.statusCode = 404
            res.end('Not Found')
            return
          }

          // Support testing null Providers field
          if (req.params.cid === TEST_CIDS.PROVIDERS_NULL) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ Providers: null }))
            return
          }

          const acceptHeader = req.headers.accept
          const data = providerData || { Providers: [] }

          if (acceptHeader?.includes('application/x-ndjson')) {
            res.setHeader('Content-Type', 'application/x-ndjson')
            const providers = Array.isArray(data.Providers) ? data.Providers : []
            res.end(providers.map(p => JSON.stringify(p)).join('\n'))
          } else {
            if (providerData?.Providers?.length === 0) {
              res.statusCode = 404
              res.end()
              return
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          }
        } catch (err) {
          console.error('Error in get providers:', err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
      echo.polka.post('/add-peers/:peerId', (req, res) => {
        callCount++
        peers.set(req.params.peerId, req.body)
        res.end()
      })
      echo.polka.get('/routing/v1/peers/:peerId', (req, res) => {
        callCount++

        // Support testing 404 responses for backward compatibility
        if (req.params.peerId === TEST_CIDS.PEERS_404) {
          res.statusCode = 404
          res.end('Not Found')
          return
        }

        // Support testing null Peers field
        if (req.params.peerId === TEST_CIDS.PEERS_NULL) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ Peers: null }))
          return
        }

        const records = peers.get(req.params.peerId)
        if (records) {
          peers.delete(req.params.peerId)
          res.end(records)
        } else {
          // Return empty JSON response
          const acceptHeader = req.headers.accept
          if (acceptHeader?.includes('application/x-ndjson')) {
            res.setHeader('Content-Type', 'application/x-ndjson')
            res.end('')
          } else {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ Peers: [] }))
          }
        }
      })
      echo.polka.post('/add-ipns/:peerId', (req, res) => {
        callCount++
        ipnsGet.set(req.params.peerId, req.body)
        res.end()
      })
      echo.polka.get('/routing/v1/ipns/:peerId', (req, res) => {
        callCount++
        const record = ipnsGet.get(req.params.peerId)
        ipnsGet.delete(req.params.peerId)

        // Support testing different content-types
        if (req.params.peerId === TEST_CIDS.IPNS_404) {
          res.statusCode = 404
          res.end('Not Found')
          return
        }

        if (req.params.peerId === TEST_CIDS.IPNS_JSON) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'not found' }))
          return
        }

        if (req.params.peerId === TEST_CIDS.IPNS_HTML) {
          res.setHeader('Content-Type', 'text/html')
          res.end('<html>Not Found</html>')
          return
        }

        if (req.params.peerId === TEST_CIDS.IPNS_NO_CONTENT_TYPE) {
          // No content-type header
          res.end('No record')
          return
        }

        if (record) {
          res.setHeader('Content-Type', 'application/vnd.ipfs.ipns-record')
          res.end(record)
        } else {
          // Per IPIP-0513: Return 200 with text/plain for no record found
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end('Record not found')
        }
      })
      echo.polka.put('/routing/v1/ipns/:peerId', (req, res) => {
        callCount++
        ipnsPut.set(req.params.peerId, req.body)
        res.end()
      })
      echo.polka.get('/get-ipns/:peerId', (req, res) => {
        callCount++
        const record = ipnsPut.get(req.params.peerId) ?? ''
        ipnsPut.delete(req.params.peerId)

        res.end(record)
      })
      echo.polka.get('/get-call-count', (req, res) => {
        res.end(callCount.toString())
      })
      echo.polka.get('/reset-call-count', (req, res) => {
        callCount = 0
        res.end()
      })
      echo.polka.get('/last-called-url', (req, res) => {
        res.end(lastCalledUrl)
      })

      await echo.start()

      return {
        env: {
          ECHO_SERVER: `http://${echo.host}:${echo.port}`
        },
        echo
      }
    },
    after: async (_, beforeResult) => {
      if (beforeResult.echo != null) {
        await beforeResult.echo.stop()
      }
    }
  }
}

export default options
