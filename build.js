var DOMParser = require('xmldom').DOMParser;
var Compile = require('./compile.js');
var fs = require('fs');

var Parser = new DOMParser();

module.exports = function(files, as_module) {
  if (!(files instanceof Array)) {
    files = [files];
  }

  var pool = {};
  files.forEach(function(file) {
    new Compile(
      Parser.parseFromString(
        fs.readFileSync(file, {encoding: 'utf8'})
      ), pool
    ).build(file.split('.')[0]);
  });

  var pool_code = [];
  Object.keys(pool).forEach(function(template) {
    pool_code.push('"' + template + '":' + pool[template]);
  });

  var lines = [];
  if (as_module) {
    lines = [
      'var jext = require("jext");',
      'module.exports = {' + pool_code.join(',') + '}'
    ];
  } else {
    lines = [
      'var template_list = {' + pool_code.join(',') + '};',
      'window.templates = jext.pool(template_list);'
    ];
  }

  return lines.join("\n");
};
