import { Request, Response, Router } from "express";
import { DbUtils } from "../utils/DbUtils";

const portsRouter: Router = Router();
//获取全部港口，访问地址：http://localhost:4300/ports/all
portsRouter.get("/all", (request: Request, response: Response) => {
  DbUtils.instance.executeSql("select id,name,namecn,code,country,line,lon,lat from ports").then(result => {
    response.json({ code: 200, data: result.rows });
  });
});
//获取全部港口，访问地址：http://localhost:4300/ports/detail?id={id}
portsRouter.get("/detail", (request: Request, response: Response) => {
  if (!request.query || !request.query.id) {
    response.json({ code: 500, data: null });
  } else {
    DbUtils.instance.executeSql("select detail from ports where id=$1", [request.query.id]).then(result => {
      response.json({ code: 200, data: result.rows.length > 0 ? result.rows[0].detail : null });
    });
  }
});

export { portsRouter };
