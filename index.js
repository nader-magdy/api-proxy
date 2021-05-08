var http = require('http'),
    httpProxy = require('http-proxy');
requestTracker = require('./request-tracker');
websocketMessageTracker = require('./websocket-message-tracker');

const { v4: uuidv4 } = require('uuid');
//
// Create your proxy server and set the target in the options.
//

// Define the command line options
const optionDefinitions = [
    { name: "port", alias: "p", type: Number, defaultValue: 5000 },
    { name: "target", alias: "t", type: String, defaultValue: "https://sample.com/api" }
];
commandLineArgs = require("command-line-args");
// parse command line options
const options = commandLineArgs(optionDefinitions);

let proxy = httpProxy.createProxyServer({}); //{target:'https://cp-services.azurewebsites.net', changeOrigin : true}).listen(8000); // See (†)

let sendError = function (res, err) {
    console.log(err);
    if (res && res.status) {
        return res.status(500).send({
            error: err,
            message: "An error occured in the proxy"
        });
    }
};
let enableCors = function (req, res) {
    if (req.headers['access-control-request-method']) {
        res.setHeader('access-control-allow-methods', req.headers['access-control-request-method']);
    }

    if (req.headers['access-control-request-headers']) {
        res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers']);
    }

    if (req.headers.origin) {
        res.setHeader('access-control-allow-origin', req.headers.origin);
        res.setHeader('access-control-allow-credentials', 'true');
    }
};

// error handling
proxy.on("error", function (err, req, res) {
    sendError(res, err);
});

// set header for CORS
proxy.on("proxyRes", function (proxyRes, req, res) {
    enableCors(req, res);
    requestTracker.response(req, proxyRes);
    // requestTracker.track(req)
});

proxy.on("proxyReq", function (proxyReq, req, res) {
    requestTracker.track(req);
});
proxy.on("proxyReqWs", function (proxyReq, req, res) {
    console.log('--- proxyReqWs ---');
    requestTracker.track(req);
});

//
// Listen for the `open` event on `proxy`.
//
proxy.on('open', function (proxySocket) {
    // listen for messages coming FROM the target here
    proxySocket.on('data', buffer => {
        websocketMessageTracker.track(buffer);
    });
});

var server = http.createServer(function (req, res) {
    // You can define here your custom logic to handle the request
    // and then proxy the request.
    if (req.method === 'OPTIONS') {
        enableCors(req, res);
        res.writeHead(200);
        res.end();
        return;
    }

    proxy.web(req, res, {
        target: options.target,
        secure: true,
        changeOrigin: true
    }, function (err) {
        sendError(res, err);
    });
});

//
// Listen to the `upgrade` event and proxy the
// WebSocket requests as well.
//
server.on('upgrade', function (req, socket, head) {
    proxy.ws(req, socket, head, {
        target: options.target,
        secure: true,
        changeOrigin: true
    }, function (err) {
        console.error(err);
        if (res) {
            sendError(res, err);
        }
    });
});

server.listen(options.port);