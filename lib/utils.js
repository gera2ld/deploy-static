const fs = require('fs');
const path = require('path');

function getPath(file) {
  if (Array.isArray(file)) return path.join(...file);
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
  return promisify(fs.rmdir, getPath(path));
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
