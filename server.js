// server.js
const next = require('next');
const http = require('http');

const port = process.env.PORT || 3000;
const app = next({ dev: false });          // production server
const handle = app.getRequestHandler();

app.prepare().then(() => {
    http.createServer((req, res) => handle(req, res)).listen(port, () => {
        console.log('Next.js running on port', port);
    });
});