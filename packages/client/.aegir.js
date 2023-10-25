import EchoServer from 'aegir/echo-server'
import body from 'body-parser'

/** @type {import('aegir').PartialOptions} */
const options = {
  test: {
    before: async () => {
      const providers = new Map()
      const peers = new Map()
      const ipnsGet = new Map()
      const ipnsPut = new Map()
      const echo = new EchoServer()
      echo.polka.use(body.raw({ type: 'application/vnd.ipfs.ipns-record'}))
      echo.polka.use(body.text())
      echo.polka.post('/add-providers/:cid', (req, res) => {
        providers.set(req.params.cid, req.body)
        res.end()
      })
      echo.polka.get('/routing/v1/providers/:cid', (req, res) => {
        const records = providers.get(req.params.cid) ?? '[]'
        providers.delete(req.params.cid)

        res.end(records)
      })
      echo.polka.post('/add-peers/:peerId', (req, res) => {
        peers.set(req.params.peerId, req.body)
        res.end()
      })
      echo.polka.get('/routing/v1/peers/:peerId', (req, res) => {
        const records = peers.get(req.params.peerId) ?? '[]'
        peers.delete(req.params.peerId)

        res.end(records)
      })
      echo.polka.post('/add-ipns/:peerId', (req, res) => {
        ipnsGet.set(req.params.peerId, req.body)
        res.end()
      })
      echo.polka.get('/routing/v1/ipns/:peerId', (req, res) => {
        const record = ipnsGet.get(req.params.peerId) ?? ''
        ipnsGet.delete(req.params.peerId)

        res.end(record)
      })
      echo.polka.put('/routing/v1/ipns/:peerId', (req, res) => {
        ipnsPut.set(req.params.peerId, req.body)
        res.end()
      })
      echo.polka.get('/get-ipns/:peerId', (req, res) => {
        const record = ipnsPut.get(req.params.peerId) ?? ''
        ipnsPut.delete(req.params.peerId)

        res.end(record)
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
