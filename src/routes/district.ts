import { Request, Response, Router } from "express";
import { DbUtils } from "../utils/DbUtils";
import * as request from 'request';
const config = require('../config.json');

const districtRouter: Router = Router();
//省列表，访问地址：http://localhost:4300/district/provincelist
districtRouter.get("/provincelist", (request: Request, response: Response) => {
  DbUtils.instance.executeSql("select id,citycode,adcode,pcode,name,idx,center,level from district WHERE level='province' and citycode='{}' order by idx").then(result => {
    var provinces = result.rows;
    DbUtils.instance.executeSql("select id,citycode,adcode,name,pcode,center,level from district WHERE level='city'").then(result => {
      var cities = result.rows;
      for (var i = 0; i < provinces.length; i++) {
        var province = provinces[i];
        province.name = province.name.replace('省', '').replace('自治区', '').replace('回族', '').replace('壮族', '').replace('维吾尔', '');
        province.districts = [];
        for (var j = 0; j < cities.length; j++) {
          var city = cities[j];
          if (city.pcode === province.adcode) {
            city.name = city.name.replace('市', '').replace('地区', '');
            province.districts.push(city);
          }
        }
      }
      response.json({ code: 200, data: provinces });
    });
  });
});
//城市列表，访问地址：http://localhost:4300/district/citylist
districtRouter.get("/citylist", (request: Request, response: Response) => {
  DbUtils.instance.executeSql("select id,citycode,adcode,name,fl,idx,pcode,center,level from district WHERE (level='city' and citycode not in ('010','021','022','023')) or (level='province' and citycode in ('010','021','022','023','1852','1853','1886')) order by idx").then(result => {
    var cities = result.rows;
    for (var j = 0; j < cities.length; j++) {
      var city = cities[j];
      city.name = city.name.replace('市', '').replace('地区', '');
    }
    response.json({ code: 200, data: cities });
  });
});
//根据中心点与级别获取城市，访问地址：http://localhost:4300/district/queryCityByCenter?center=113,22&level={level}
districtRouter.get("/queryCityByCenter", (request: Request, response: Response) => {
  if (!request.query || !request.query.center) {
    response.json({ code: 500, data: null });
  } else {
    DbUtils.instance.executeSql("SELECT id,citycode,adcode,pcode,name,center,level from district where st_contains(geom,st_geometryfromtext($1,4326))", ["point(" + request.query.center.replace(/,/g, ' ') + ")"]).then(result => {
      var data = {};
      for (let i = 0; i < result.rows.length; i++) {
        const city = result.rows[i];
        data[city.level] = city;
      }
      var city;
      if (request.query.level === 'country') {
        city = data['country'];
      } else if (request.query.level === 'province') {
        city = data['province'] || data['country'];
      } else if (!request.query.level || request.query.level === 'city') {
        city = data['city'] || data['province'] || data['country'];
      } else if (request.query.level === 'district') {
        city = data['district'] || data['city'] || data['province'] || data['country'];
      }
      response.json({ code: 200, data: city || { adcode: '', name: '未知区域' } });
    });
  }
});
//天气，访问地址：http://localhost:4300/district/weather?adcode={adcode}
districtRouter.get("/weather", (req: Request, res: Response) => {
  var query = "";
  for (const key in req.query) {
    if (req.query.hasOwnProperty(key)) {
      query += key + "=" + req.query[key] + "&";
    }
  }
  query = query.substr(0, query.length - 1);
  var url = config.serverConfig.weatherUrl + "?" + query;
  request(url, (error, response, body) => {
    if (error) {
      res.json({ code: 500, data: null });
    } else {
      res.json({ code: 200, data: JSON.parse(body) });
    }
  });
});

export { districtRouter };
