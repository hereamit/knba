const http = require("http");
const next = require("next");

// This entrypoint is ONLY used in production (cPanel / Passenger / LiteSpeed Node).
// Local development should use `npm run dev` instead.
const dev = false;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http
    .createServer((req, res) => handle(req, res))
    .listen(() => {
      console.log("KNBA frontend ready");
    });
});
