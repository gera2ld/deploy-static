const fs = require('fs');
const path = require('path');
const ArgumentParser = require('argparse').ArgumentParser;

const commonParser = new ArgumentParser({
  addHelp: false,
});
commonParser.addArgument(['-d', '--dist'], {
  help: 'the directory to hold the static files',
  defaultValue: 'dist',
});

const parser = new ArgumentParser({
  version: require('../package.json').version,
  description: 'Deploy static files with a static.json file',
});

const subparsers = parser.addSubparsers({
  dest: 'command',
});

const parserFetch = subparsers.addParser('fetch', {
  help: 'fetch static files defined by static.json',
  parents: [commonParser],
});
parserFetch.addArgument('static', {
  help: 'the URL or path of static.json, stdin will be read if none is provided',
  nargs: '?',
});
parserFetch.addArgument(['-t', '--tag'], {
  help: 'the tag of current version, will be used as the subdirectory name, default as current date',
});
parserFetch.addArgument(['-f', '--force'], {
  help: 'whether to overwrite files if tag exists',
  action: 'storeTrue',
});
parserFetch.addArgument(['-p', '--prefix'], {
  help: 'the URL prefix for all items with relative paths',
  defaultValue: '',
});
parserFetch.addArgument(['-S', '--save-static'], {
  help: 'whether to store the static.json file',
  action: 'storeTrue',
  defaultValue: false,
});

const parserLink = subparsers.addParser('link', {
  help: 'link the target tag to `current`',
  parents: [commonParser],
});
parserLink.addArgument('tag', {
  help: 'the tag or folder name of the version to be linked',
});

const args = module.exports = parser.parseArgs();

if (args.command === 'fetch') {
  if (!args.tag || !args.force) {
    const originalTag = args.tag = args.tag || new Date().toLocaleDateString();
    var num = 0;
    if (!args.force) while (1) {
      const tag = num ? `${originalTag}-${num}` : originalTag;
      try {
        fs.lstatSync(path.join(args.dist, tag));
      } catch (e) {
        args.tag = tag;
        break;
      }
      num ++;
    }
  }
  args.dir = path.join(args.dist, args.tag);
} else if (args.command === 'link') {
  args.dir = path.join(args.dist, args.tag);
}
