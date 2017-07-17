import { join } from 'path';

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
 //IfStatement:this.buildExpressionHandler(node, ['test'], path, opts);
//IfStatement:buildExpressionHandler(node.test, ['left', 'right'], path, opts);,node.test表示if语句的判断部分
//所以，如果仅仅出现if语句我们也会引入default/css/less文件
//ExportDefaultDeclaration:this.buildExpressionHandler(node, ['declaration'], path, opts);
  buildExpressionHandler(node, props, path, opts) {
    const { file } = path.hub;
    const types = this.types;
    props.forEach(prop => {
      if (!types.isIdentifier(node[prop])) return;
      if (this.specified[node[prop].name]) {
        //更新该node的prop，其会引入我们的default/css/less，同时返回一个id
        node[prop] = this.importMethod(node[prop].name, file, opts);
      }
    });
  }

 //this.buildDeclaratorHandler(node, 'value', path, opts);
  buildDeclaratorHandler(node, prop, path, opts) {
    const { file } = path.hub;
    const types = this.types;
    if (!types.isIdentifier(node[prop])) return;
    if (this.specified[node[prop].name]) {
      //如果该node指定了value这个值，那么我们会更新node这个value的值
      //该方法就是更新某一个node的特定prop属性
      node[prop] = this.importMethod(node[prop].name, file, opts);
    }
  }
  //插件的Program阶段实例化三个空对象
  Program() {
    this.specified = Object.create(null);
    this.libraryObjs = Object.create(null);
    this.selectedMethods = Object.create(null);
  }

 //如果我们的import导入和我们配置的插件关注的libaryName一致，那么保存到this.specified和this.libraryObjs
 //this.specified中保存的是import { Button } from 'antd'这样导入的
  ImportDeclaration(path,  {opts} ) {
    const { node } = path;
    //我们的path对象保存到node中
    // path maybe removed by prev instances.
    if (!node) return;
    const { value } = node.source;
    //import { Button } from 'antd';
    //source指的是'antd'
    const libraryName = this.libraryName;
    // ["aa", { "libraryName": "antd" }]
    const types = this.types;
    //获取babel-types对象
    if (value === libraryName) {
      //如果是关注的库，也就是导入了哪些对象
      node.specifiers.forEach(spec => {
        //import {Button,Select} from 'antd';
        //specifiers={Button,Select}
        if (types.isImportSpecifier(spec)) {
          this.specified[spec.local.name] = spec.imported.name;
          //spec.imported.name代表Button,Select
          //spec.local.name代表Button,Select
          //this.specified['Button']='Button',this.specified['Select']='Select'
        } else {
          //import Button from "antd";  是"ImportDefaultSpecifier"
          //import * as foo from "foo";  是"ImportNamespaceSpecifier"
          //得到this.libraryObjs['Button']=true
          this.libraryObjs[spec.local.name] = true;
        }
      });
      path.remove();
    }
  }
  //import { Button } from 'antd';
  //ReactDOM.render(<div>
  //   <Button>xxxx</Button>
  // </div>,$('#id'));
  CallExpression(path, { opts }) {
    const { node } = path;
    //保存path
    const { file } = path.hub;
    //获取hub，得到一个File类型，是BabelNodeFile .https://github.com/liangklfang/babel/blob/master/packages/babel-traverse/src/hub.js
    const { name, object, property } = node.callee;
    //object是ReactDOM，property是render
    const types = this.types;

    if (types.isIdentifier(node.callee)) {
      if (this.specified[name]) {
        node.callee = this.importMethod(this.specified[name], file, opts);
      }
    }
    //获取到两个参数
    node.arguments = node.arguments.map(arg => {
      const { name: argName } = arg;
      //获取到两个参数的名字
      if (this.specified[argName] &&
        path.scope.hasBinding(argName) &&
        path.scope.getBinding(argName).path.type === 'ImportSpecifier') {
        //如果在this.specified里面，那么我们直接import就可以了
        return this.importMethod(this.specified[argName], file, opts);
      }
      return arg;
    });
  }
  //如ReactDOM.render,opts就是插件配置时候传入的参数
  //node.object.name指的是调用者
  MemberExpression(path, { opts }) {
    const { node } = path;
    const { file } = path.hub;
    // multiple instance check.
    if (!node.object || !node.object.name) return;
     //如ReactDOM.render就是获取到ReactDOM
     //只有条件满足value === libraryName我们才会更新MemberExpression
    if (this.libraryObjs[node.object.name]) {
      // antd.Button -> _Button
      // this.specified['Button']='Button',this.specified['Select']='Select'
      // this.libraryObjs['Button']=true
      path.replaceWith(this.importMethod(node.property.name, file, opts));
      //node.property.name就是对象的某个方法
      //file就是File对象
      //opts就是插件传入的配置参数
    } else if (this.specified[node.object.name]) {
      node.object = this.importMethod(this.specified[node.object.name], file, opts);
      //
    }
  }

 // Property
  Property(path, {opts}) {
    const { node } = path;
    this.buildDeclaratorHandler(node, 'value', path, opts);
  }
  //VariableDeclarator
  VariableDeclarator(path, {opts}) {
    const { node } = path;
    this.buildDeclaratorHandler(node, 'init', path, opts);
  }

  LogicalExpression(path, {opts}) {
    const { node } = path;
    this.buildExpressionHandler(node, ['left', 'right'], path, opts);
  }

  ConditionalExpression(path, {opts}) {
    const { node } = path;
    this.buildExpressionHandler(node, ['test', 'consequent', 'alternate'], path, opts);
  }
  //IfStatement
  IfStatement(path, {opts}) {
    const { node } = path;
    this.buildExpressionHandler(node, ['test'], path, opts);
    this.buildExpressionHandler(node.test, ['left', 'right'], path, opts);
  }
//ExpressionStatement
  ExpressionStatement(path, {opts}){
    const { node } = path;
    const { types } = this;
    if(types.isAssignmentExpression(node.expression)){
      this.buildExpressionHandler(node.expression, ['right'], path, opts);
    }
  }
  //buildExpressionHandler
  ExportDefaultDeclaration(path, { opts }) {
    const { node } = path;
    this.buildExpressionHandler(node, ['declaration'], path, opts);
  }
}

function camel2Dash(_str) {
  const str = _str[0].toLowerCase() + _str.substr(1);
  return str.replace(/([A-Z])/g, function camel2DashReplace($1) {
    return '-' + $1.toLowerCase();
  });
}

function camel2Underline(_str) {
  const str = _str[0].toLowerCase() + _str.substr(1);
  return str.replace(/([A-Z])/g, function ($1) {
    return '_' + $1.toLowerCase();
  });
}

function winPath(path) {
  return path.replace(/\\/g, '/');
}
