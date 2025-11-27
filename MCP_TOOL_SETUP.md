# MCP 工具集成指南

本指南将帮助你将自己的 MCP 服务作为工具集成到 chatbot 中。

## 概述

MCP (Model Context Protocol) 工具集成允许 AI 模型在对话过程中调用你的 MCP 服务提供的工具。AI 会自动识别何时需要调用工具，并执行相应的操作。

## 工作流程

1. **AI 对话** - 用户与 AI 进行对话（使用 OpenAI、Claude 等）
2. **工具识别** - AI 识别需要调用工具的场景
3. **工具调用** - AI 调用 MCP 服务提供的工具
4. **结果处理** - AI 将工具执行结果整合到回复中

## 配置步骤

### 1. 更新 .env 文件

在项目根目录的 `.env` 文件中添加以下配置：

```env
# 启用 MCP 工具功能
VITE_ENABLE_MCP_TOOLS=true

# MCP 服务器配置
VITE_MCP_SERVER_URL=http://localhost:3001
VITE_MCP_COOKIE_ID=your-cookie-id-here
```

### 2. 配置项说明

| 配置项 | 说明 | 必填 | 默认值 |
|--------|------|------|--------|
| `VITE_ENABLE_MCP_TOOLS` | 启用 MCP 工具功能 | ✅ | `false` |
| `VITE_MCP_SERVER_URL` | MCP 服务器地址 | ✅ | `http://localhost:3001` |
| `VITE_MCP_COOKIE_ID` | 用于身份验证的 Cookie ID | ✅ | 空 |

### 3. MCP 服务器要求

你的 MCP 服务器需要支持 JSON-RPC 2.0 协议，并提供以下方法：

#### initialize
初始化连接：
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {}
}
```

#### tools/list
获取工具列表：
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

响应格式：
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "meeting_create",
        "description": "创建会议",
        "inputSchema": {
          "type": "object",
          "properties": {
            "command": {
              "type": "object",
              "properties": {
                "moderator": {
                  "type": "object",
                  "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"}
                  },
                  "required": ["id", "name"]
                },
                "title": {"type": "string"},
                "startTime": {"type": "number"},
                "type": {"type": "string"}
              },
              "required": ["moderator", "title", "startTime", "type"]
            }
          },
          "required": ["command"]
        }
      }
    ]
  }
}
```

#### tools/call
调用工具：
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "meeting_create",
    "arguments": {
      "command": {
        "moderator": {"id": "user123", "name": "张三"},
        "title": "项目讨论会",
        "startTime": 1704067200000,
        "type": "normal"
      }
    }
  }
}
```

### 4. 身份验证

**重要**：所有 MCP 请求都必须在 HTTP 请求头中包含 `cookieId`：

```http
POST / HTTP/1.1
Host: your-mcp-server.com
Content-Type: application/json
cookieId: your-cookie-id-here

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {}
}
```

## 使用示例

### 基本对话

配置完成后，AI 会自动识别需要调用工具的场景：

1. **用户**: "帮我创建一个会议，标题是项目讨论会，时间是明天下午2点"
2. **AI**: 识别需要调用 `meeting_create` 工具
3. **系统**: 调用 MCP 工具，获取结果
4. **AI**: "已成功创建会议：项目讨论会，时间：明天下午2点"

### 工具调用流程

```
用户消息
    ↓
AI 分析（识别需要调用工具）
    ↓
获取 MCP 工具列表
    ↓
构造工具调用参数
    ↓
调用 MCP 工具 (tools/call)
    ↓
获取工具执行结果
    ↓
AI 整合结果并回复用户
```

## 工具 Schema 要求

每个工具必须提供完整的 `inputSchema`（JSON Schema），AI 会根据 Schema 构造参数：

- **必需字段**：Schema 中的 `required` 字段必须提供
- **类型验证**：参数类型必须符合 Schema 定义
- **嵌套对象**：支持复杂的嵌套对象结构

## 故障排除

### 工具调用失败

**错误**：`调用 MCP 工具失败`

**解决方法**：
1. 检查 `VITE_ENABLE_MCP_TOOLS=true` 是否设置
2. 确认 `VITE_MCP_COOKIE_ID` 配置正确
3. 检查 MCP 服务器是否正常运行
4. 查看浏览器控制台的详细错误信息

### 身份验证失败

**错误**：`MCP 错误 [401]: Unauthorized`

**解决方法**：
1. 确认 `VITE_MCP_COOKIE_ID` 配置正确
2. 检查 Cookie ID 是否有效
3. 确认 MCP 服务器正确处理 `cookieId` 请求头

### 工具参数错误

**错误**：`缺少必需字段: command`

**解决方法**：
1. 检查工具的 `inputSchema` 是否正确
2. 确认所有 `required` 字段都有值
3. 查看工具 Schema 定义，确保参数格式正确

### CORS 问题

如果遇到 CORS 错误，需要在 MCP 服务器中添加 CORS 支持：

```javascript
// Express 示例
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
```

## 支持的 AI 模型

目前支持工具调用的 AI 模型：

- ✅ **OpenAI GPT-3.5/GPT-4** - 完整支持工具调用
- ⚠️ **Claude** - 需要根据 Claude 的工具调用格式调整
- ⚠️ **自定义 API** - 需要兼容 OpenAI 工具调用格式

## 高级用法

### 自定义工具匹配

可以修改 `src/services/mcpToolService.js` 中的 `smartCallTool` 函数来实现更智能的工具匹配逻辑。

### 工具调用结果格式化

工具返回的结果会被自动格式化为字符串，如果返回的是对象，会转换为 JSON 格式。

### 多工具调用

AI 可以在一次对话中调用多个工具，系统会按顺序执行并整合结果。

## 示例：会议创建工具

假设你的 MCP 服务提供了 `meeting_create` 工具：

**用户消息**：
```
帮我创建一个会议，标题是"项目讨论会"，主持人是张三（ID: user123），时间是明天下午2点
```

**AI 处理流程**：
1. 识别需要调用 `meeting_create` 工具
2. 从消息中提取参数：
   - title: "项目讨论会"
   - moderator: {id: "user123", name: "张三"}
   - startTime: 计算明天下午2点的时间戳
   - type: "normal"
3. 调用 MCP 工具
4. 返回结果给用户

## 下一步

- 实现更智能的参数提取
- 支持流式工具调用
- 添加工具调用历史记录
- 支持工具调用链（一个工具的结果作为另一个工具的输入）

祝你使用愉快！🚀

