function clearln() {
  if (pos) {
    exports.out.write(`\r${' '.repeat(pos)}\r`);
    pos = 0;
  }
}

function write(...data) {
  clearln();
  data.forEach(piece => {
    piece = piece.toString();
    exports.out.write(piece);
    pos += piece.length;
  });
}

function writeln(...data) {
  write(...data, '\n');
}

var pos = 0;

exports.out = process.stdout;
exports.write = write;
exports.writeln = writeln;
