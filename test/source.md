module.exports = {
  "content": [
    "article",
    [
      "h3",
      "1.mark-twain解析出来的无法解析成为ast"
    ],
    [
      "pre",
      {
        "lang": "jsx"
      },
      [
        "code",
        "import { Button } from 'antd';\nReactDOM.render(\n  <div>\n    <Button type=\"primary\" shape=\"circle\" icon=\"search\" />\n    <Button type=\"primary\" icon=\"search\">Search</Button>\n    <Button shape=\"circle\" icon=\"search\" />\n    <Button icon=\"search\">Search</Button>\n    <br />\n    <Button type=\"ghost\" shape=\"circle\" icon=\"search\" />\n    <Button type=\"ghost\" icon=\"search\">Search</Button>\n    <Button type=\"dashed\" shape=\"circle\" icon=\"search\" />\n    <Button type=\"dashed\" icon=\"search\">Search</Button>\n  </div>,\n  mountNode\n);"
      ]
    ]
  ],
  "meta": {

  }
}