import EchoServer from 'aegir/echo-server'
import body from 'body-parser'

/** @type {import('aegir').PartialOptions} */
const options = {
  test: {
    before: async () => {
      const providers = new Map()
      const echo = new EchoServer()
      echo.polka.use(body.text())
      echo.polka.post('/add-providers/:cid', (req, res) => {
        providers.set(req.params.cid, req.body)
        res.end()
      })
      echo.polka.get('/routing/v1/providers/:cid', (req, res) => {
        const provs = providers.get(req.params.cid) ?? '[]'
        providers.delete(req.params.cid)

        res.end(provs)
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
