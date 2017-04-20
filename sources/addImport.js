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
