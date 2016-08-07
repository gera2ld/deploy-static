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
  .then(url => url ? fetch({url}) : readStdIn())
  .then(text => text == null ? Promise.reject('Error fetching static.json') : text)
  .then(text => {
    args.save_static && utils.writeFile([args.dir, 'static.json'], text);
    return JSON.parse(text);
  });
}

function link(dir) {
  return utils.symlink(dir, [args.dist, 'current']);
}

function commandFetch() {
  logger.writeln('Fetching tag: ', args.tag);
  getStaticJson()
  .then(files => files && Promise.all(files.map(fetch)))
  .then(res => {
    if (!res || res.some(item => item == null)) return Promise.reject('Failed');
    return link(args.dir);
  })
  .then(() => logger.writeln('Finished'), err => logger.writeln(err));
}

function commandLink() {
  logger.writeln('Linking to tag: ', args.tag);
  utils.lstat(args.dir)
  .then(() => link(args.dir))
  .then(() => logger.writeln('Finished'), err => {
    logger.writeln('Version not exists: ', args.dir);
  });
}

const handle = {
  fetch: commandFetch,
  link: commandLink,
}[args.command];
handle && handle();
