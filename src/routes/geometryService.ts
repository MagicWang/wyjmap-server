import { Request, Response, Router } from "express";
var jsts = require('jsts');

const geometryServiceRouter: Router = Router();
//缓冲区服务，访问地址：http://localhost:4300/geometryService/buffer?wkt={wkt}&radius={radius}
geometryServiceRouter.all("/buffer", (request: Request, response: Response) => {
  var param = request.method.toLowerCase() === "post" ? request.body : request.query;
  var wkt = param.wkt;
  var radius = parseFloat(param.radius);
  if (!wkt || isNaN(radius)) {
    response.end({ code: 10002 });
    return;
  }
  var reader = new jsts.io.WKTReader();
  var writer = new jsts.io.WKTWriter();
  var jstsGeom = reader.read(wkt);
  var buffered = jstsGeom.buffer(radius);
  var result = writer.write(buffered);
  response.json({ code: 200, data: result });
});

export { geometryServiceRouter };
