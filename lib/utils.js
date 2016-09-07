const fs = require('fs');
const path = require('path');

function getPath(file) {
  if (Array.isArray(file)) {
    const invalid = file.find(part => typeof part !== 'string');
    if (invalid) throw {msg: 'Invalid argument', payload: invalid};
    return path.join(...file);
  }
  return String(file);
}

function promisify(nodeFunc, ...args) {
  return new Promise((resolve, reject) => {
    args.push((err, data) => {
      err ? reject(err) : resolve(data);
    });
    nodeFunc(...args);
  });
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function lstat(path) {
  return promisify(fs.lstat, getPath(path));
}

function unlink(path) {
  return promisify(fs.unlink, getPath(path));
}

function readFile(file) {
  return promisify(fs.readFile, getPath(file), 'utf8');
}

function writeFile(file, data) {
  return promisify(fs.writeFile, getPath(file), data, 'utf8');
}

function rename(oldPath, newPath) {
  return promisify(fs.rename, getPath(oldPath), getPath(newPath));
}

function readdir(path) {
  return promisify(fs.readdir, getPath(path));
}

function rmdir(path) {
  function doRmdir() {
    return readdir(path)
    .then(names => names.map(name => {
      const fullpath = [path, name];
      return lstat(fullpath)
        .then(stat => stat.isDirectory() ? rmdir(fullpath) : unlink(fullpath));
    }))
    .then(() => promisify(fs.rmdir, path))
    .catch(err => {
      if (err.code === 'ENOTEMPTY' && retry ++ < maxRetry) {
        return delay(retry * 100).then(doRmdir);
      }
      throw err;
    });
  }
  var retry = 0;
  const maxRetry = 3;
  path = getPath(path);
  return doRmdir();
}

function readlink(path) {
  return promisify(fs.readlink, getPath(path));
}

function symlink(target, link) {
  const linkPath = getPath(link);
  const targetPath = path.relative(path.dirname(linkPath), getPath(target));
  return lstat(linkPath)
  .then(() => unlink(linkPath), () => {})
  .then(() => promisify(fs.symlink, targetPath, linkPath));
}

module.exports = {
  getPath,
  delay,
  lstat,
  rename,
  readFile,
  writeFile,
  readlink,
  symlink,
  unlink,
  readdir,
  rmdir,
};
