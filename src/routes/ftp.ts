import { Request, Response, Router } from "express";
import * as multer from 'multer';
const ftp = require("basic-ftp");
const config = require('../config.json');
var fs = require('file-system');
import * as path from 'path';
var streamBuffers = require('stream-buffers');

const ftpRouter: Router = Router();
ftpRouter.get(/^\/download\/(\S+)$/, async (request: Request, response: Response) => {
  var url = request.params[0];
  try {
    var buffer = await download(url);
    response.send(buffer);
  } catch (error) {
    response.json({ code: -1, data: error, message: '下载失败' });
  }
});
ftpRouter.post("/upload", multer({ dest: 'uploads/' }).any(), async (request: Request, response: Response) => {
  var file = request.files && request.files[0];
  var path = request.body && request.body.path;
  if (!file) response.json({ code: -1, data: null, message: '上传文件为空' });
  try {
    var url = await upload(file, path);
    response.json({ code: 0, data: url, message: '上传成功' });
  } catch (error) {
    response.json({ code: -1, data: error, message: '上传失败' });
  }
});
ftpRouter.delete("/delete", async (request: Request, response: Response) => {
  var url = request.query && request.query.url;
  try {
    await remove(url);
    response.json({ code: 0, data: true, message: '删除成功' });
  } catch (error) {
    response.json({ code: -1, data: false, message: '删除失败' });
  }
});
async function upload(file, filepath?) {
  const client = await access(filepath);
  var ext = path.extname(file.originalname);
  var filename = file.filename + ext;
  await client.upload(fs.createReadStream(file.path), filename);
  client.close();
  fs.unlink(file.path);
  return filepath ? filepath + '/' + filename : filename;
}
async function download(url: string) {
  var path, filename;
  var i = url.lastIndexOf('/');
  if (i >= 0) {
    path = url.substring(0, i);
    filename = url.substring(i + 1);
  } else {
    filename = url;
  }
  const client = await access(path);
  var writableStreamBuffer = new streamBuffers.WritableStreamBuffer();
  await client.download(writableStreamBuffer, filename);
  client.close();
  writableStreamBuffer.end();
  return writableStreamBuffer.getContents();
}
async function remove(url: string) {
  var path, filename;
  var i = url.lastIndexOf('/');
  if (i >= 0) {
    path = url.substring(0, i);
    filename = url.substring(i + 1);
  } else {
    filename = url;
  }
  const client = await access(path);
  await client.remove(filename);
  client.close();
}
async function access(path?) {
  const client = new ftp.Client();
  await client.access({
    host: config.serverConfig.ftpUrl
  });
  await client.cd('upload');
  path && await client.ensureDir(path);
  return client;
}
export { ftpRouter };
