import { json, urlencoded } from "body-parser";
import * as compression from "compression";
import * as express from "express";
import * as path from "path";
import * as http from "http";

import { placeRouter } from "./routes/place";
import { districtRouter } from "./routes/district";
import { ftpRouter } from "./routes/ftp";
import { tilesRouter } from "./routes/tiles";
import { portsRouter } from "./routes/ports";
import { geometryServiceRouter } from "./routes/geometryService";

const config = require('./config.json');

const app: express.Application = express();

app.disable("x-powered-by");

app.use(json());
app.use(compression());
app.use(urlencoded({ extended: true }));
app.use((req: express.Request, res: express.Response, next) => {
  // 服务端要支持跨域，否则会出现跨域问题
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
// api routes
app.use("/place", placeRouter);//poi相关
app.use("/district", districtRouter);//行政区域相关
app.use("/ftp", ftpRouter);//ftp相关
app.use("/tiles", tilesRouter);//瓦片相关
app.use("/ports", portsRouter);//港口相关
app.use("/geometryService", geometryServiceRouter);//几何服务相关

if (app.get("env") === "production") {
  // in production mode run application from dist folder
  // app.use(express.static(path.join(__dirname, "../tiles")));
}

// catch 404 and forward to error handler
app.use((req: express.Request, res: express.Response, next) => {
  var error = new Error('404 not found');
  next(error);
});

// production error handler
// no stacktrace leaked to user
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(err.status || 500);
  res.json({
    error: {},
    message: err.message,
  });
});

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort((config && config.serverConfig && config.serverConfig.port) || 4300);
app.set("port", port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val): boolean | number {

  const normalizedPort = parseInt(val, 10);

  if (isNaN(normalizedPort)) {
    // named pipe
    return val;
  }

  if (normalizedPort >= 0) {
    // port number
    return normalizedPort;
  }

  return false;
}

/**
 * Event listener for HTTP server 'error' event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string"
    ? "Pipe " + port
    : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server 'listening' event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string"
    ? "pipe " + addr
    : "port " + addr.port;
}
