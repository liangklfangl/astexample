const parse  = require('babylon').parse;
const generate = require('babel-generator').default;
// console.log(generate);
const code = 'class Example {}';
const ast = parse(code);

const output = generate(ast, { /* options */ }, code);
console.log(typeof output.code);
//这里输出的code属性是字符串，常用于结合nunjucks