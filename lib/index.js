const fetch = require('./fetch');
const args = require('./args');
const utils = require('./utils');
const logger = require('./logger');

function readStdIn() {
  return new Promise((resolve, reject) => {
    var data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', err => reject(err));
  });
}

function getStaticJson() {
  return Promise.resolve(args.static)
  .then(url => {
    if (!url) return Promise.reject();
    return fetch({
      url: args.static,
    });
  })
  .catch(readStdIn)
  .then(text => {
    args.save_static && utils.writeFile([args.dir, 'static.json'], text);
    return JSON.parse(text);
  });
}

function link() {
  const current = utils.getPath([args.dist, 'current']);
  return utils.lstat(current)
  .then(() => utils.unlink(current), () => {})
  .then(() => utils.symlink(args.dir, current));
}

logger.writeln('Current tag: ', args.tag);

getStaticJson()
.then(files => files && Promise.all(files.map(fetch)))
.then(link)
.then(() => logger.writeln('Finished.'), err => logger.writeln(err));
