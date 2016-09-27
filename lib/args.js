const path = require('path');
const ArgumentParser = require('argparse').ArgumentParser;

function init() {
  const parser = new ArgumentParser({
    version: require('../package.json').version,
    description: 'Deploy static files with a static.json file',
  });
  const subparsers = parser.addSubparsers({
    dest: 'command',
  });
  const common = initCommon();
  initSubFetch(subparsers, common);
  initSubLink(subparsers, common);
  initSubClean(subparsers, common);
  return parser;
}
function initCommon() {
  const parser = new ArgumentParser({
    addHelp: false,
  });
  parser.addArgument(['-d', '--dist'], {
    help: 'the directory to hold the static files',
    defaultValue: '.',
  });
  parser.addArgument(['-V', '--verbose'], {
    help: 'Show verbose log.',
    action: 'storeTrue',
  });
  return [parser];
}
function initSubFetch(subparsers, common) {
  const parserFetch = subparsers.addParser('fetch', {
    help: 'fetch static files defined by static.json',
    parents: common,
  });
  parserFetch.addArgument('static', {
    help: 'the URL or path of static.json, stdin will be read if none is provided',
  });
  parserFetch.addArgument(['-t', '--tag'], {
    help: 'the tag of current version, will be used as the subdirectory name, default as current date',
  });
  parserFetch.addArgument(['-f', '--force'], {
    help: 'whether to reuse files in an existed tag',
    action: 'storeTrue',
  });
  parserFetch.addArgument(['-p', '--prefix'], {
    help: 'the URL prefix for all items with relative paths',
    defaultValue: '',
  });
  parserFetch.addArgument(['-S', '--save-static'], {
    help: 'whether to store the static.json file',
    action: 'storeTrue',
  });
}
function initSubLink(subparsers, common) {
  const parserLink = subparsers.addParser('link', {
    help: 'link the target tag to `current`',
    parents: common,
  });
  parserLink.addArgument('tag', {
    help: 'the tag or folder name of the version to be linked',
  });
}
function initSubClean(subparsers, common) {
  const parserClean = subparsers.addParser('clean', {
    help: 'clean obsolete packages',
    parents: common,
  });
  parserClean.addArgument(['-t', '--tag'], {
    help: 'Remove obsolete versions by tags.',
    nargs: '+',
  });
  parserClean.addArgument(['-n', '--number'], {
    help: 'Remove the first NUMBER of obsolete versions. If value not provided, the first one will be removed.',
  });
  parserClean.addArgument(['-k', '--keep'], {
    help: 'Remove obsolete versions and keep last KEEP ones. If value not provided, the last 4 will be kept.',
  });
  parserClean.addArgument(['-N', '--dry'], {
    help: 'Show versions to be cleaned and exit.',
    action: 'storeTrue',
  });
}

const args = module.exports = init().parseArgs();

args.dirs = {
  current: 'current',
  versions: 'versions',
};

if (args.command === 'link') {
  args.dir = path.join(args.dist, args.dirs.versions, args.tag);
} else if (args.command === 'clean') {
  if (args.tag) {
    args.number = args.keep = null;
  } else if (args.number) {
    args.keep = null;
  } else if (!args.keep) {
    args.keep = 4;
  }
}
