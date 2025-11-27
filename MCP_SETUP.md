# MCP 服务集成指南

本指南将帮助你配置和使用自己的 MCP (Model Context Protocol) 服务。

## 什么是 MCP？

MCP (Model Context Protocol) 是一个用于 AI 应用与外部工具和数据源集成的协议。它允许 AI 应用：
- 调用外部工具（Tools）
- 访问外部资源（Resources）
- 使用提示词模板（Prompts）

## 配置步骤

### 1. 更新 .env 文件

在项目根目录的 `.env` 文件中添加以下配置：

```env
# 设置使用 MCP 作为 AI 提供商
VITE_AI_PROVIDER=mcp

# MCP 服务器配置
VITE_MCP_SERVER_URL=http://localhost:3001
VITE_MCP_API_KEY=your-mcp-api-key-here

# MCP 功能开关
VITE_MCP_ENABLE_TOOLS=true
VITE_MCP_ENABLE_RESOURCES=true
```

### 2. 配置项说明

| 配置项 | 说明 | 必填 | 默认值 |
|--------|------|------|--------|
| `VITE_AI_PROVIDER` | 设置为 `mcp` | ✅ | - |
| `VITE_MCP_SERVER_URL` | MCP 服务器的 URL | ✅ | `http://localhost:3001` |
| `VITE_MCP_API_KEY` | MCP 服务器的 API Key（如果需要） | ❌ | 空 |
| `VITE_MCP_ENABLE_TOOLS` | 是否启用工具调用功能 | ❌ | `false` |
| `VITE_MCP_ENABLE_RESOURCES` | 是否启用资源访问功能 | ❌ | `false` |

### 3. MCP 服务器端点

系统会尝试以下端点（按顺序）：

#### 聊天端点
- `/chat` 或 `/mcp/chat` - 用于对话

#### 工具端点
- `/tools` 或 `/mcp/tools` - 获取可用工具列表
- `/tools/call` 或 `/mcp/tools/call` - 调用工具

#### 资源端点
- `/resources` 或 `/mcp/resources` - 获取可用资源列表
- `/resources/read` 或 `/mcp/resources/read` - 读取资源

#### 其他端点
- `/health` 或 `/mcp/health` - 健康检查
- `/info` 或 `/mcp/info` - 服务器信息

## MCP 服务器 API 格式

### 聊天接口

**请求：**
```json
POST /chat
{
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ]
}
```

**响应：**
```json
{
  "message": "你好！有什么可以帮助你的吗？"
}
```

或者：
```json
{
  "content": "你好！有什么可以帮助你的吗？"
}
```

### 工具接口

**获取工具列表：**
```json
GET /tools

响应：
{
  "tools": [
    {
      "name": "search",
      "description": "搜索功能",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "搜索关键词"
          }
        }
      }
    }
  ]
}
```

**调用工具：**
```json
POST /tools/call
{
  "name": "search",
  "arguments": {
    "query": "Vue 3"
  }
}

响应：
{
  "result": "搜索结果..."
}
```

## 使用示例

### 基本对话

配置完成后，chatbot 会自动使用你的 MCP 服务进行对话：

1. 用户发送消息
2. 系统调用 MCP 服务器的 `/chat` 端点
3. 返回 AI 回复

### 工具调用

如果启用了工具功能（`VITE_MCP_ENABLE_TOOLS=true`），系统会：

1. 获取可用工具列表
2. 根据用户消息智能匹配工具
3. 调用相应的工具
4. 返回工具执行结果

### 资源访问

如果启用了资源功能（`VITE_MCP_ENABLE_RESOURCES=true`），可以：

1. 获取可用资源列表
2. 读取特定资源
3. 在对话中使用资源内容

## 自定义 MCP 端点

如果你的 MCP 服务器使用不同的端点路径，可以修改 `src/services/mcpService.js` 中的端点配置。

## 故障排除

### 连接失败

**错误：** `MCP API error: Failed to fetch`

**解决方法：**
1. 检查 MCP 服务器是否正在运行
2. 确认 `VITE_MCP_SERVER_URL` 配置正确
3. 检查网络连接和防火墙设置
4. 确认服务器支持 CORS（如果从浏览器直接调用）

### 工具调用失败

**错误：** `调用 MCP 工具失败`

**解决方法：**
1. 确认 `VITE_MCP_ENABLE_TOOLS=true`
2. 检查工具端点是否正确实现
3. 查看浏览器控制台的详细错误信息

### CORS 问题

如果遇到 CORS 错误，需要在 MCP 服务器中添加 CORS 支持：

```javascript
// Express 示例
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
```

或者使用代理服务器转发请求。

## 高级用法

### 自定义工具匹配逻辑

可以修改 `src/services/mcpService.js` 中的 `smartMCPCall` 函数来实现更智能的工具匹配。

### 流式响应

如果需要支持流式响应，可以修改 `mcpService.js` 来支持 Server-Sent Events (SSE) 或 WebSocket。

### 认证

如果 MCP 服务器需要认证，在 `.env` 中设置 `VITE_MCP_API_KEY`，系统会自动在请求头中添加 `Authorization: Bearer {key}`。

## 示例 MCP 服务器

这里是一个简单的 Express MCP 服务器示例：

```javascript
const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())

// 聊天端点
app.post('/chat', async (req, res) => {
  const { messages } = req.body
  // 处理消息并返回回复
  res.json({
    message: '这是来自 MCP 服务器的回复'
  })
})

// 工具列表
app.get('/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'example_tool',
        description: '示例工具'
      }
    ]
  })
})

app.listen(3001, () => {
  console.log('MCP 服务器运行在 http://localhost:3001')
})
```

## 下一步

- 实现更复杂的工具调用逻辑
- 添加资源访问功能
- 支持流式响应
- 添加错误重试机制

祝你使用愉快！🚀

