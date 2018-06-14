import { Request, Response, Router } from "express";
import { DbUtils } from "../utils/DbUtils";

const placeRouter: Router = Router();
//兴趣点，访问地址：http://localhost:4300/place/text?keywrod={keywrod}&pageSize={pageSize}&pageIndex={pageIndex}
placeRouter.get("/text", (request: Request, response: Response) => {
  var keyword = request.query.keyword;
  var pageSize = parseInt(request.query.pageSize);
  var pageIndex = parseInt(request.query.pageIndex);
  if (!keyword || isNaN(pageSize) || isNaN(pageIndex)) {
    response.end({ code: 10002 });
    return;
  }
  var offset = (pageIndex - 1) * pageSize;
  DbUtils.instance.executeSql("select count(*) from poi WHERE name like $1", ['%' + keyword + '%']).then(result => {
    var count = parseInt(result.rows[0].count) || 0;
    DbUtils.instance.executeSql("select * from poi WHERE name like $1 limit $2 offset $3", ['%' + keyword + '%', pageSize, offset]).then(result => {
      response.json({ code: 200, count: count, pageSize: pageSize, pageIndex: pageIndex, data: result.rows });
    });
  });
});

export { placeRouter };
