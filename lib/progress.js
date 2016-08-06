const logger = require('./logger');

function message(status, data) {
  return `[${finished}/${total}] ${status} ${data}`;
}

function finish(data, err) {
  finished ++;
  const i = items.indexOf(data);
  if (~i) {
    items.splice(i, 1);
    if (index > i) index --;
  }
  const status = err ? 'Failed!!!' : 'Fetched:';
  logger.writeln(message(status, data.toString()));
  showItems();
}

function push(data) {
  total ++;
  items.push(data);
  timer || showItems();
}

function showItems() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!items.length) return;
  const item = items[index] || items[index = 0];
  logger.write(message('Fetching...', item.toString()));
  index ++;
  timer = setTimeout(showItemsLater, 1000);
}

function showItemsLater() {
  timer = null;
  showItems();
}

var finished = 0;
var total = 0;
var index = 0;
var timer;
const items = [];

exports.push = push;
exports.finish = finish;
