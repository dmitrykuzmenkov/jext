var fs = require('fs');
var Compile = require('./compile.js');
var DOMParser = require('xmldom').DOMParser;
var files = ['test.html'];
var Parser = new DOMParser();

var pool = {};

files.forEach(function (file) {
  template = fs.readFileSync(file, {encoding: 'utf8'});
  new Compile(Parser.parseFromString(template), pool).build(file.split('.')[0]);
});

var pool_code = [];
Object.keys(pool).forEach(function(template) {
  pool_code.push('"' + template + '":' + pool[template]);
});

console.log('{' + pool_code.join(',') + '}');
