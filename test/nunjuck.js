const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const tmpl = fs.readFileSync(path.join(__dirname, 'template.html')).toString();
const html = nunjucks.renderString(tmpl, {
      script: "function test(){}"
    });
//虽然我这里是字符串，但是nunjucks转化后却变成了函数
const fileName = `demo-${Math.random()}.html`;
fs.writeFile(path.join("./", fileName), html);