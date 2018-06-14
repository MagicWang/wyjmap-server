import { Request, Response, Router } from "express";
import * as multer from 'multer';
const ftp = require("basic-ftp");
const config = require('../config.json');
var fs = require('file-system');
import * as path from 'path';
var streams = require('memory-streams');

const ftpRouter: Router = Router();
ftpRouter.get(/^\/download\/(\S+)$/, async (request: Request, response: Response) => {
  var filename = request.params[0];
  try {
    var buffer = await download(filename);
    response.send(buffer);
  } catch (error) {
    response.json({ code: -1, data: error, message: '' });
  }
});
ftpRouter.post("/upload", multer({ dest: 'uploads/' }).any(), async (request: Request, response: Response) => {
  var file = request.files && request.files[0];
  if (!file) response.json({ code: -1, data: null, message: '上传文件为空' });
  try {
    var filename = await upload(file);
    response.json({ code: 0, data: filename, message: '上传成功' });
  } catch (error) {
    response.json({ code: -1, data: error, message: '' });
  }
});
async function upload(file) {
  var ext = path.extname(file.originalname);
  const client = new ftp.Client();
  await client.access({
    host: config.serverConfig.ftpUrl
  });
  await client.cd('upload');
  var filename = file.filename + ext;
  await client.upload(fs.createReadStream(file.path), filename);
  client.close();
  fs.unlink(file.path);
  return filename;
}
async function download(filename) {
  const client = new ftp.Client();
  await client.access({
    host: config.serverConfig.ftpUrl
  });
  await client.cd('upload');
  var writer = new streams.WritableStream();
  await client.download(writer, filename);
  client.close();
  return writer.toBuffer();
}
export { ftpRouter };
