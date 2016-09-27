const path = require('path');
const fetch = require('./fetch');
const args = require('./args');
const utils = require('./utils');
const logger = require('./logger');

function link(dir) {
  return utils.symlink(dir, [args.dist, args.dirs.current]);
}

function commandFetch() {
  function getStaticJson() {
    args.verbose && logger.writeln('Fetching static.json...');
    return Promise.resolve(args.static)
    .then(url => fetch({url}))
    .then(text => text == null ? Promise.reject('Error fetching static.json') : text);
  }
  function getDate() {
    const d = new Date;
    return `${d.getFullYear()}${d.getMonth()}${d.getDate()}`;
  }
  function tryDir(ver, num) {
    const name = num ? `${ver}_${num}` : ver;
    return utils.lstat(path.join(args.dist, args.dirs.versions, name))
    .then(() => tryDir(ver, (num || 0) + 1), err => {
      if (err && err.code === 'ENOENT') return name;
      throw err;
    });
  }
  function getDir(ver) {
    return new Promise(resolve => {
      if (!ver || !args.force) {
        ver = ver || getDate();
        if (!args.force) return resolve(tryDir(ver));
      }
      resolve(ver);
    })
    .then(ver => path.join(args.dist, args.dirs.versions, ver));
  }
  return getStaticJson()
  .then(text => {
    let json = JSON.parse(text);
    if (Array.isArray(json)) json = {files: json};
    args.verbose && logger.writeln('Fetching: ', json.version || args.tag || 'default version');
    return getDir(json.version || args.tag)
    .then(dir => {
      args.save_static && utils.writeFile([dir, 'static.json'], text);
      return {json, dir};
    });
  })
  .then(({json, dir}) => {
    return Promise.all(json.files.map(item => fetch(item, dir)))
    .then(res => {
      if (!res || res.some(item => item == null)) return Promise.reject('Failed');
      return link(dir);
    });
  })
  .then(() => args.verbose && logger.writeln('Finished'), err => {
    logger.writeln(err);
    throw err;
  });
}

function commandLink() {
  logger.writeln('Linking to tag: ', args.tag);
  return utils.lstat(args.dir)
  .then(() => link(args.dir))
  .then(() => args.verbose && logger.writeln('Finished'), err => {
    logger.writeln('Version not exists: ', args.dir);
    throw err;
  });
}

function commandClean() {
  function loadVersions() {
    args.verbose && logger.writeln('Loading versions...');
    const promiseList = utils.readdir([args.dist, args.dirs.versions])
    .then(names => Promise.all(names.map(name => {
      return utils.lstat([args.dist, args.dirs.versions, name])
      .then(stat => stat.isDirectory() && {
        name,
        created: new Date(stat.ctime).getTime(),
      });
    })), err => {
      logger.writeln('No version is found at: ', args.dist);
      throw err;
    })
    .then(list => list.filter(item => item));
    const promiseMeta = utils.readFile([args.dist, 'meta.json'])
    .then(data => JSON.parse(data))
    .catch(() => ({}));
    const promiseLink = utils.readlink([args.dist, args.dirs.current])
    .then(data => path.relative(args.dirs.versions, data))
    .catch(() => {});
    return Promise.all([
      promiseList,
      promiseMeta,
      promiseLink,
    ])
    .then(res => {
      const [list, meta, link] = res;
      list.forEach(item => {
        meta && Object.assign(item, meta[item.name]);
        item.current = item.name === link;
        item.protected = !item.created;
      });
      list.sort((a, b) => {
        if (a.protected && b.protected) return 0;
        if (a.protected) return 1;
        if (b.protected) return -1;
        if (a.created === b.created) {
          return a.name === b.name ? 0 : a.name < b.name ? -1 : 1;
        } else {
          return Math.sign(a.created - b.created);
        }
      });
      return list;
    });
  }
  function removeList(toRemove) {
    if (args.dry) {
      if (toRemove.length) {
        logger.writeln('Will remove versions: ', toRemove.map(item => item.name).join(', '));
      } else {
        logger.writeln('No version will be removed');
      }
      return Promise.resolve();
    }
    return Promise.all(toRemove.map(item => {
      return utils.rmdir([args.dist, args.dirs.versions, item.name])
        .then(() => args.verbose && logger.writeln('Tag removed: ', item.name));
    }));
  }
  function cleanByTags(list) {
    return removeList(args.tag.map(tag => {
      const item = list.find(item => item.name === tag);
      if (item.current) {
        logger.writeln('Cannot remove current version: ', tag);
      } else if (item.protected) {
        logger.writeln('Cannot remove protected version: ', tag);
      } else {
        return tag;
      }
    }).filter(tag => tag));
  }
  function cleanByNumber(list) {
    const toRemove = list.filter(item => !item.current && !item.protected).slice(0, args.number);
    return removeList(toRemove);
  }
  function cleanByKeep(list) {
    const canRemove = list.filter(item => !item.current && !item.protected);
    const toRemove = canRemove.slice(0, Math.max(0, canRemove.length - args.keep));
    return removeList(toRemove);
  }
  return loadVersions()
  .then(args.tag ? cleanByTags : args.number ? cleanByNumber : cleanByKeep)
  .catch(err => {
    logger.writeln(err);
    throw err;
  });
}

const handle = {
  fetch: commandFetch,
  link: commandLink,
  clean: commandClean,
}[args.command];

handle().catch(err => {
  args.verbose && console.error(err);
  process.exit(1);
});
