import assert from 'assert';
import Plugin from './Plugin';
const util = require('util');
//默认这里传入的参数是babel，可以通过babel.types获取types，这里使用了解构的方式
//在babelrc中配置内容如下:
// ["aa", { "libraryName": "antd" }]
export default function ({ types }) {

  let plugins = null;

  // Only for test
  global.__clearBabelAntdPlugin = () => {
    plugins = null;
  };

//t.program(body, directives)
//这里的body是将源代码转化为AST的结果，program是语法树的最高层
//opts表示获取到的对象，即{ libraryName: 'antd' }
  function Program(path, { opts }) {
     // console.log(util.inspect(opts,{showHidden:true,depth:4}));
     // console.log("--------------------------");
    // Init plugin instances once.
    if (!plugins) {
      if (Array.isArray(opts)) {
        plugins = opts.map(({ libraryName, libraryDirectory, style, camel2DashComponentName, camel2UnderlineComponentName }) => {
          assert(libraryName, 'libraryName should be provided');
          return new Plugin(libraryName, libraryDirectory, style, camel2DashComponentName, camel2UnderlineComponentName, types);
        });
      } else {
        opts = opts || {};
        assert(opts.libraryName, 'libraryName should be provided');
        //必须提供libraryName
        plugins = [
          new Plugin(opts.libraryName, opts.libraryDirectory, opts.style, opts.camel2DashComponentName, opts.camel2UnderlineComponentName, types),
        ];
      }
    }
    // console.log('>>>>arguments Program>>>',util.inspect(arguments[0].hub.file.constructor,{showHidden:true,depth:2}));
    // 这里的arguments第一个Program这个Node，第二个是PluginPass对象
    applyInstance('Program', arguments, this);
  }

  const methods = [
    'ImportDeclaration',
    'CallExpression',
    'MemberExpression',
    'Property',
    'VariableDeclarator',
    'LogicalExpression',
    'ConditionalExpression',
    'IfStatement',
    'ExpressionStatement',
    'ExportDefaultDeclaration',
  ];
  //此处的method就是如"ImportDeclaration"等
  //如果该plugin能够处理import，那么我们就使用这个babel的这个plugin来处理
  function applyInstance(method, args, context) {
    for (const plugin of plugins) {
      if (plugin[method]) {
        plugin[method].apply(plugin, [...args, context]);
      }
    }
  }
 //默认visitor中有一个Program:function Program(){} 
 //detail:https://github.com/liangklfang/babel/tree/master/packages/babel-types
//t.program(body, directives)
  const ret = {
    visitor: { Program },
  };

  for (const method of methods) {
    //为我们的Visitor添加babel处理规则，其中visitor中每一个属性的值都是一个函数
    ret.visitor[method] = function () {
   // console.log('>>>>arguments other>>>',arguments);
      //t.importDeclaration(specifiers, source)
      //这里的arguments在调用的时候会自动执行，ret.visitor是为了维持上下文而已
      applyInstance(method, arguments, ret.visitor);
    };
  }

  return ret;
}
