const parse  = require('babylon').parse;
const generate = require('babel-generator').default;
// console.log(generate);
const code = 'class Example {}';
const ast = parse(code);

const output = generate(ast, { /* options */ }, code);
console.log(output);