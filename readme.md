####babel-plugin-add-module-export的plugin
```js
module.exports = ({types}) => ({
  visitor: {
    Program: {
     //exit表示进入节点
      exit (path) {
        if (path.BABEL_PLUGIN_ADD_MODULE_EXPORTS) {
         //是否已经处理过了一次,这里的path是整个AST的最高层program
         //因为我们这里是对visitor中的program进行处理的
          return
        }
        let hasExportDefault = false
        let hasExportNamed = false
        //得到语法树所有的`body`部分，如果需要访问该Node请使用path.node!
        path.get('body').forEach((path) => {
          if (path.isExportDefaultDeclaration()) {
            //是否是通过export default来向外导出的，如果是那么我们继续循环下面的导出语句,这里的forEach语句会继续执行下面的循环
            hasExportDefault = true
            return
          }
          //export Test这种方式
          if (path.isExportNamedDeclaration()) {
            if (path.node.specifiers.length === 1 && path.node.specifiers[0].exported.name === 'default') {
              hasExportDefault = true
              //已经导出了default
            } else {
              hasExportNamed = true
              //表示导出了
            }
            return
          }
        })
        //如果有了export default类型导出，同时没有export { foo, awesome, bar };  这种导出，那么我们就会处理export default为module.exports =exports.default
        if (hasExportDefault && !hasExportNamed) {
          path.pushContainer('body', [
          //t.assignmentExpression(operator, left, right)
            types.expressionStatement(types.assignmentExpression(
              '=',
              types.memberExpression(types.identifier('module'), types.identifier('exports')),
              types.memberExpression(types.identifier('exports'), types.stringLiteral('default'), true)
              //t.memberExpression(object, property, computed)
              //此时module.exports = exports.default
              //最后采用pushContainer将其放在Program的body的最后面
            ))
          ])
        }
        path.BABEL_PLUGIN_ADD_MODULE_EXPORTS = true
      }
    }
  }
})
```
下面是细节部分：如果使用了ES6的export default
```js
export default class Test {}
//此时path.isExportDefaultDeclaration()为true
```
如果使用了ES6的export那么：
```js
export class Test {}
//此时path.isExportNamedDeclaration()为true，但是此时我们的node的specifier是[]，即空数组
```
如果使用了module.exports(commonjs),那么我们的该插件不会做任何处理！！！
```js
export { foo, awesome, bar };  
//此时specifier如下
```
![](./sp.PNG)

```js
export{ foo as default };  
//此时将会满足path.node.specifiers.length === 1 && path.node.specifiers[0].exported.name === 'default'
```
至于上面的exit时机，可以[查看这里](http://www.tuicool.com/articles/IZzEJjm)，其中enter表示进入节点而leave表示离开节点！

总之：该插件只会处理`export default/export{ foo as default }`这种类型，将它处理为`module.exports=exports.default`，而像如`export { foo, awesome, bar };`  这种类型是不会处理的,他会`原样保存到源码中`!

####下面是babel-plugin-import的plugin源码
```js
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
    // console.log('>>>>arguments>>>',arguments);
    // 这里的arguments一个是第一个path，第二个是PluginPass对象
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
      //t.importDeclaration(specifiers, source)
      //这里的arguments在调用的时候会自动执行，ret.visitor是为了维持上下文而已
      applyInstance(method, arguments, ret.visitor);
    };
  }

  return ret;
}
```
我们先不分析Plugin这个插件到底做了什么，我们先分析下上面这段代码到底做了什么？以及我们到底能学到什么？

（1）首先看看下面这段代码：
```js
export default function ({ types }) {}
//这里传入的其实是babel对象，其含有的内容很丰富，但是我们这里只是关注types而已，具体你可以查看下面的参考资料
```
（2）然后看看下面这段代码：
```js
  const ret = {
    visitor: { Program },
  };
```
我们的Program其实是AST最高层的节点，其中我们对babel的plugin传入的参数可以在方法Program中获取到!如下：
```js
  function Program(path, { opts }) {}
  //通过opts获取配置的参数
```
其中完整的Program方法传入的第二个参数的内容[可以点击这里，他是一个PluginPass对象](./sources/param.md)，你可以在上面说的babel-plugin-add-module-export这个插件中手动输出该参数，然后看一下！
（3）看看下面代码
```js
for (const method of methods) {
    //为我们的Visitor添加babel处理规则，其中visitor中每一个属性的值都是一个函数
    ret.visitor[method] = function () {
      //t.importDeclaration(specifiers, source)
      //这里的arguments在调用的时候会自动执行，ret.visitor是为了维持上下文而已
      applyInstance(method, arguments, ret.visitor);
    };
  }
```
也就是说当AST解析的时候会自动调用我们插件Plugin中的相应的方法。而且有一点一定要注意：我们的每一个方法传入的arguments对象包含两个属性，`其中第一个就是我们的path对象`，而第二个对象就是我们上面说的[PluginPass对象](./sources/param.md)]，这个对象的opts就是我们配置该babel插件时候传入的参数。完整的arguments对象可以[点击这里](./sources/node.md)。总之，`不仅仅是上面的Program，包括其他的如ImportDeclaration传入的都是一样的参数，第一个参数是path，而第二个参数是PluginPass对象`！

下面我们看看Plugin具体做了什么？我们给出主要部分：
```js
export default class Plugin {
  //实例化过程：new Plugin(libraryName, libraryDirectory, style, camel2DashComponentName, camel2UnderlineComponentName, types);
  //其中types就是传入到babel插件的types,detail:http://www.tuicool.com/articles/rMFRF32
  constructor(libraryName, libraryDirectory, style, camel2DashComponentName, camel2UnderlineComponentName, types) {
    this.specified = null;
    this.libraryObjs = null;
    this.selectedMethods = null;
    this.libraryName = libraryName;
    //libraryName配置，如配置的'antd'等
    this.libraryDirectory = typeof libraryDirectory === 'undefined'
      ? 'lib'
      : libraryDirectory;
      //libraryDirectory默认是lib目录下
    this.camel2DashComponentName = typeof camel2DashComponentName === 'undefined'
      ? true
      : camel2DashComponentName;
      //如果camel2DashComponentName没有配置那么我们转化为中间线链接的名字
    this.camel2UnderlineComponentName = camel2UnderlineComponentName;
    //camel2UnderlineComponentName转化为下划线
    this.style = style || false;
    //配置的时候添加的style，例如"css"
    this.types = types;
    //babel插件原生的types，来自于babel-types库
  }

// this.importMethod(this.specified[name], file, opts)
// 作用是：导入组件的某个方法，同时如果配置了css那么导入css
  importMethod(methodName, file, opts) {
    if (!this.selectedMethods[methodName]) {
      const libraryDirectory = this.libraryDirectory;
      //导入目录
      const style = this.style;
      //配置的style
      const transformedMethodName = this.camel2UnderlineComponentName
        ? camel2Underline(methodName)
        : this.camel2DashComponentName
          ? camel2Dash(methodName)
          : methodName;
      //对方法名称进行处理
      const path = winPath(join(this.libraryName, libraryDirectory, transformedMethodName));
      //将特定插件，特定目录，特定的方法进行处理
      this.selectedMethods[methodName] = file.addImport(path, 'default');
      //引入这个特定方法的default对象,这里是导出了这个组件本身 module.exports.default= require('path');
      //addImport返回import导入时候一个独立的id值
      if (style === true) {
        file.addImport(`${path}/style`, 'style');
        //将目录`${path}/style`下的index.js导入到style对象上，相当于module.exports.style =require(`${path}/style`)
      } else if(style === 'css') {
        file.addImport(`${path}/style/css`, 'style');
        //将文件`${path}/style/css.js`导入到style对象上
      }
    }
    //导入组件的default方法
    return this.selectedMethods[methodName];
   }
  }
```
具体代码我们已经注释过了，如果需要进一步学习，请查看[babel-traverse](https://github.com/liangklfang/babel/tree/master/packages/babel-traverse/src)
其中addImport方法的源码也贴出来：
```js
 function addImport(source, imported) {
    var name = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : imported;
    //如果只有两个参数那么name就是imported，否则就是 arguments[2] 
    var alias = source + ":" + imported;
    //source是一个路径，如file.addImport(`${path}/style/css`, 'style');
    //所以alias= `${path}/style/css` : "style"
    var id = this.dynamicImportIds[alias];
     //引入id
    if (!id) {
      source = this.resolveModuleSource(source);
      //解析路径指向的资源，即`${path}/style/css`
      id = this.dynamicImportIds[alias] = this.scope.generateUidIdentifier(name);
      //产生一个独一无二的Identifier，name就是我们第二个参数。
      //也就是通过我们的第二个参数产生一个唯一的Identifier，如上面指定的'style'
      //import style from 'antd';
      var specifiers = [];
      if (imported === "*") {
        specifiers.push(t.importNamespaceSpecifier(id));
      } else if (imported === "default") {
        specifiers.push(t.importDefaultSpecifier(id));
      } else {
        specifiers.push(t.importSpecifier(id, t.identifier(imported)));
      }
     //这里有三个Specifier，即importNamespaceSpecifier，importDefaultSpecifier，importSpecifier
      var declar = t.importDeclaration(specifiers, t.stringLiteral(source));
      //以source为名，也就是完整的路径名称来产生一个import
      declar._blockHoist = 3;
      //将这个import添加到body的最前面
      this.path.unshiftContainer("body", declar);
    }
    return id;
  }
```
#### babel-plugin-check-es2015-constants
```js
export default function ({ messages }) {
  return {
    visitor: {
      Scope({ scope }) {
        //scope
        for (const name in scope.bindings) {
          const binding = scope.bindings[name];
          //binding对象
          if (binding.kind !== "const" && binding.kind !== "module") continue;
          //只关注const与module种类
          for (const violation of (binding.constantViolations: Array)) {
            throw violation.buildCodeFrameError(messages.get("readOnly", name))
            ;
          }
        }
      },
    }
  };
}
```
今天就写到这里，以后遇到了这类问题也会及时更新中。。。。。



参考资料：

[【译】通过开发 Babel 插件理解抽象语法树（AST）](http://www.tuicool.com/articles/rMFRF32)

[Babel.js 插件开发（一）：Babel 与 AST](http://www.tuicool.com/articles/ANNFjy6)

[Babel.js插件开发之二 - 开始编写](http://www.tuicool.com/articles/7zuY3qM)

[理解 Babel 插件](http://www.tuicool.com/articles/IZzEJjm)

[AST查看器](https://astexplorer.net/#/tSIO7NIclp)

[babel-plugin-add-module-export](https://github.com/liangklfang/babel-plugin-add-module-exports/blob/master/src/index.js)

[ ES6学习——模块化：import和export](http://blog.csdn.net/kittyjie/article/details/50642558)