const fs = require('fs');
const path = require('path');
const http = require('http');
const ensureDir = require('ensure-dir');
const progress = require('./progress');
const args = require('./args');
const utils = require('./utils');

function writeToFile(fullpath, res) {
  const tmp = fullpath + '.fetching';
  return ensureDir(path.dirname(fullpath))
  .then(() => new Promise((resolve, reject) => {
    res.on('error', err => reject(err));
    const stream = fs.createWriteStream(tmp);
    stream.on('close', resolve);
    res.pipe(stream);
  }))
  .then(() => utils.rename(tmp, fullpath))
  .then(() => true);
}
function readData(res) {
  return new Promise((resolve, reject) => {
    var data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve(data));
    res.on('error', err => reject(err));
  });
}

function request(obj) {
  return new Promise((resolve, reject) => {
    const req = http.get(obj.url, res => {
      if (res.statusCode === 404) return reject({
        status: 404,
        message: 'Not found: ' + obj.url,
      });
      const promise = (obj.path ? writeToFile(obj.path, res) : readData(res))
      .catch(err => Promise.reject({message: err}));
      resolve(promise);
    });
    req.setTimeout(3000, () => req.abort());
    req.on('error', () => reject({message: 'Net error'}));
  });
}

function tryRequest(obj) {
  return request(obj)
  .catch(err => {
    if (!err.status) {
      obj.retry ++;
      if (obj.retry < MAX_RETRY) return tryRequest(obj);
    }
    return Promise.reject(err);
  });
}

function fetch(item) {
  function finish(err, data) {
    progress.finish(obj, err);
    return data;
  }
  function doFetch() {
    progress.push(obj);
    return tryRequest(obj)
    .then(data => finish(null, data), err => finish(err));
  }
  const obj = {
    url: item.url.includes('://') ? item.url : args.prefix + item.url,
    path: item.path && path.join(args.dir, item.path),
    retry: 0,
    toString() {
      const retry = obj.retry ? ` (retry ${obj.retry})` : '';
      return `${obj.url}${retry}`;
    },
  };
  return utils.lstat(obj.path)
  .then(() => true, doFetch);
}

const MAX_RETRY = 3;
module.exports = fetch;
