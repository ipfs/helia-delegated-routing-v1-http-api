import EchoServer from "aegir/echo-server";
import body from "body-parser";

/** @type {import('aegir').PartialOptions} */
const options = {
  test: {
    before: async () => {
      let callCount = 0;
      let lastCalledUrl = "";
      const providers = new Map();
      const peers = new Map();
      const ipnsGet = new Map();
      const ipnsPut = new Map();
      const echo = new EchoServer();
      echo.polka.use(body.raw({ type: "application/vnd.ipfs.ipns-record" }));
      echo.polka.use(body.text());
      echo.polka.use(body.json());
      echo.polka.use((req, res, next) => {
        next();
        lastCalledUrl = req.url;
      });

      echo.polka.post("/add-providers/:cid", (req, res) => {
        callCount++;
        try {
          console.log("Received POST request body:", req.body);
          console.log("Content-Type:", req.headers["content-type"]);

          // Only process if content-type is application/json
          if (req.headers["content-type"]?.includes("application/json")) {
            const data =
              typeof req.body === "string"
                ? {
                    Providers: req.body
                      .split("\n")
                      .map((line) => JSON.parse(line)),
                  }
                : req.body;
            providers.set(req.params.cid, data);
            res.end(JSON.stringify({ success: true }));
          } else {
            res.statusCode = 400;
            res.end(
              JSON.stringify({
                error: "Invalid content type. Expected application/json",
                code: "ERR_INVALID_INPUT",
              })
            );
            // Clear any existing providers for this CID
            providers.delete(req.params.cid);
          }
        } catch (err) {
          console.error("Error in add-providers:", err);
          res.statusCode = 400;
          res.end(
            JSON.stringify({
              error: err.message,
              code: "ERR_INVALID_INPUT",
            })
          );
          providers.delete(req.params.cid);
        }
      });

      echo.polka.get("/routing/v1/providers/:cid", (req, res) => {
        callCount++;
        try {
          console.log("GET request for CID:", req.params.cid);
          console.log("Accept header:", req.headers.accept);

          const providerData = providers.get(req.params.cid) || {
            Providers: [],
          };

          const acceptHeader = req.headers.accept;
          if (acceptHeader?.includes("application/x-ndjson")) {
            res.setHeader("Content-Type", "application/x-ndjson");
            const providers = Array.isArray(providerData.Providers)
              ? providerData.Providers
              : [];
            res.end(providers.map((p) => JSON.stringify(p)).join("\n"));
          } else {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(providerData));
          }
        } catch (err) {
          console.error("Error in get providers:", err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      echo.polka.post("/add-peers/:peerId", (req, res) => {
        callCount++;
        peers.set(req.params.peerId, req.body);
        res.end();
      });
      echo.polka.get("/routing/v1/peers/:peerId", (req, res) => {
        callCount++;
        const records = peers.get(req.params.peerId) ?? "[]";
        peers.delete(req.params.peerId);

        res.end(records);
      });
      echo.polka.post("/add-ipns/:peerId", (req, res) => {
        callCount++;
        ipnsGet.set(req.params.peerId, req.body);
        res.end();
      });
      echo.polka.get("/routing/v1/ipns/:peerId", (req, res) => {
        callCount++;
        const record = ipnsGet.get(req.params.peerId) ?? "";
        ipnsGet.delete(req.params.peerId);

        res.end(record);
      });
      echo.polka.put("/routing/v1/ipns/:peerId", (req, res) => {
        callCount++;
        ipnsPut.set(req.params.peerId, req.body);
        res.end();
      });
      echo.polka.get("/get-ipns/:peerId", (req, res) => {
        callCount++;
        const record = ipnsPut.get(req.params.peerId) ?? "";
        ipnsPut.delete(req.params.peerId);

        res.end(record);
      });
      echo.polka.get("/get-call-count", (req, res) => {
        res.end(callCount.toString());
      });
      echo.polka.get("/reset-call-count", (req, res) => {
        callCount = 0;
        res.end();
      });
      echo.polka.get("/last-called-url", (req, res) => {
        res.end(lastCalledUrl);
      });

      await echo.start();

      return {
        env: {
          ECHO_SERVER: `http://${echo.host}:${echo.port}`,
        },
        echo,
      };
    },
    after: async (_, beforeResult) => {
      if (beforeResult.echo != null) {
        await beforeResult.echo.stop();
      }
    },
  },
};

export default options;
