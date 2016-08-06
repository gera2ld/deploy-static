const fs = require('fs');
const path = require('path');

function getPath(file) {
  if (typeof file === 'string') return file;
  return path.join(...file);
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

function symlink(target, link) {
  const linkPath = getPath(link);
  const targetPath = path.relative(path.dirname(linkPath), getPath(target));
  return promisify(fs.symlink, targetPath, linkPath);
}

module.exports = {
  getPath,
  lstat,
  unlink,
  readFile,
  writeFile,
  symlink,
};
