function clearln() {
  if (pos) {
    exports.out.write(`\r${' '.repeat(pos)}\r`);
    pos = 0;
  }
}

function write(...data) {
  clearln();
  data = data.join('');
  exports.out.write(data);
  pos += data.length;
}

function writeln(...data) {
  clearln();
  exports.out.write(`${data.join('')}\n`);
}

var pos = 0;

exports.out = process.stdout;
exports.write = write;
exports.writeln = writeln;
