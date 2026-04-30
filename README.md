# idfactory-resolver-mcp

这是一个本地 stdio MCP server，用于通过下面的接口解析 ID Factory handle 记录：

```text
http://bj.resolve.idfactory.cn:8081/{handle}
```

`8081` 端口后面的内容是动态变化的。例如，`88.111.1` 和 `88.111.1/111` 都可以作为 handle 输入。

## 工具

### `resolve_handle`

解析一个动态 handle 路径。

输入：

```json
{
  "handle": "88.111.1/111"
}
```

工具会请求：

```text
GET http://bj.resolve.idfactory.cn:8081/88.111.1/111
```

返回内容包括格式化后的文本 JSON，以及 MCP structured content，方便客户端继续处理。

## 开发

安装依赖、运行测试、构建项目：

```bash
npm install
npm test
npm run build
```

直接运行 stdio server：

```bash
npm run build
node dist/index.js
```

## MCP 客户端配置

构建完成后，可以在本地 stdio MCP 客户端中使用下面的配置：

```json
{
  "mcpServers": {
    "idfactory-resolver-mcp": {
      "command": "node",
      "args": [
        "/Users/wsc-laptop/teleinfo-project/recursion-mcp/dist/index.js"
      ]
    }
  }
}
```

如果客户端会从当前项目目录执行命令，也可以使用开发模式：

```json
{
  "mcpServers": {
    "idfactory-resolver-mcp": {
      "command": "npm",
      "args": ["run", "dev"]
    }
  }
}
```

日常使用建议优先配置构建后的 `dist/index.js`。

## 通过 npx 使用

如果代码已经发布到 GitHub，可以直接使用 GitHub 仓库作为 npx 包来源：

```bash
npx -y github:<OWNER>/idfactory-resolver-mcp
```

对应的 MCP 客户端配置可以写成：

```json
{
  "mcpServers": {
    "idfactory-resolver-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "github:<OWNER>/idfactory-resolver-mcp"
      ]
    }
  }
}
```

如果后续发布到 npm，并且包名仍为 `idfactory-resolver-mcp`，则可以直接使用：

```bash
npx -y idfactory-resolver-mcp
```

对应的 MCP 客户端配置：

```json
{
  "mcpServers": {
    "idfactory-resolver-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "idfactory-resolver-mcp"
      ]
    }
  }
}
```

当前检查结果：`recursion-mcp` 这个 npm 包名已经被占用，`idfactory-resolver-mcp` 目前未发布，更适合作为后续 npm 包名和 npx 命令名。
