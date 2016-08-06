const fs = require('fs');
const path = require('path');
const ArgumentParser = require('argparse').ArgumentParser;

const parser = new ArgumentParser({
  version: require('../package.json').version,
  description: 'Deploy static files with a static.json file',
});
parser.addArgument(['-s', '--static'], {
  help: 'the URL or path of static.json',
});
parser.addArgument(['-d', '--dist'], {
  help: 'the directory to hold the static files',
  defaultValue: 'dist',
});
parser.addArgument(['-t', '--tag'], {
  help: 'the tag of current version, will be used as the subdirectory name',
});
parser.addArgument(['-p', '--prefix'], {
  help: 'the URL prefix for all items with relative paths',
  defaultValue: '',
});
parser.addArgument(['-S', '--save-static'], {
  help: 'whether to store the static.json file',
  action: 'storeTrue',
  defaultValue: false,
});

const args = module.exports = parser.parseArgs();

if (!args.tag) {
  var date = new Date().toLocaleDateString();
  var num = 0;
  while (1) {
    const tag = num ? `${date}-${num}` : date;
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
