import { Request, Response, Router } from "express";
var fs = require('file-system');
import * as path from 'path';
const config = require('../config.json');
var tilelive = require('@mapbox/tilelive');
require('@mapbox/mbtiles').registerProtocols(tilelive);

const tilesRouter: Router = Router();

var tilesDir = path.join(__dirname, '../', config.serverConfig.tilesDir);
var tilesCacheDir = path.join(__dirname, '../', config.serverConfig.tilesCacheDir);
var sources = {};

//瓦片服务，访问地址：http://localhost:4300/tiles/{name}/{z}/{x}/{y}
tilesRouter.get(/^\/(\w+)\/(\d+)\/(\d+)\/(\d+)$/, (request: Request, response: Response) => {
    var name = request.params[0];
    var z = request.params[1];
    var x = request.params[2];
    var y = request.params[3];

    var file = path.join(tilesCacheDir, name, z, x, y + '.png');
    if (fs.existsSync(file)) {
        response.sendfile(file);
    } else {
        var dir = path.dirname(file);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        var source = sources[name];
        if (source) {
            source.getTile(z, x, y, function (err, tile, headers) {
                if (err) {
                    response.status(404);
                    response.send(err.message);
                    console.log(err.message);
                } else {
                    response.set(headers);
                    response.send(tile);
                    fs.writeFileSync(file, tile);
                }
            });
        } else {
            tilelive.load('mbtiles://' + path.join(tilesDir, name, "file.mbtiles"), function (err, source) {
                if (err) {
                    response.status(404);
                    response.send(err.message);
                    console.log(err.message);
                } else {
                    sources[name] = source;
                    source.getTile(z, x, y, function (err, tile, headers) {
                        if (err) {
                            response.status(404);
                            response.send(err.message);
                            console.log(err.message);
                        } else {
                            response.set(headers);
                            response.send(tile);
                            fs.writeFileSync(file, tile);
                        }
                    });
                }
            });
        }
    }
});
export { tilesRouter };
