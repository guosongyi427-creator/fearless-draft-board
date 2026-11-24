// Concatenated test runner: data.js + engine.js + assertions, one scope.
const fs = require('node:fs');
const dataSrc = fs.readFileSync('app/js/data.js', 'utf8');
const engineSrc = fs.readFileSync('app/js/engine.js', 'utf8');
const testSrc = fs.readFileSync('tests/test-body.js', 'utf8');
eval(dataSrc + '\n' + engineSrc + '\n' + testSrc);
