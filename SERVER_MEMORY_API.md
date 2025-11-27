# 服务端存储 API 规范

本文档描述了服务端存储 API 的接口规范，用于实现跨页面/跨设备的对话历史同步。

## 概述

服务端存储 API 允许将对话历史保存到服务端，实现：
- ✅ 跨页面同步（新标签页可以看到历史消息）
- ✅ 跨设备同步（不同设备可以看到相同的历史）
- ✅ 数据持久化（不依赖浏览器本地存储）

## 配置

在 `.env` 文件中添加以下配置：

```env
# 启用服务端存储
VITE_ENABLE_SERVER_MEMORY=true

# 服务端 API 地址
VITE_MEMORY_SERVER_URL=http://localhost:3399

# Cookie ID（用于用户身份识别，复用 MCP 的配置）
VITE_MCP_COOKIE_ID=your-cookie-id-here
```

## API 接口规范

### 1. 保存消息历史

**请求**
```http
POST /api/messages
Content-Type: application/json
cookieId: your-cookie-id-here

{
  "messages": [
    {
      "type": "user",
      "text": "你好",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "isError": false
    },
    {
      "type": "bot",
      "text": "你好！有什么可以帮助你的吗？",
      "timestamp": "2024-01-01T00:00:01.000Z",
      "isError": false
    }
  ]
}
```

**响应**
```json
{
  "success": true,
  "message": "消息已保存",
  "count": 2
}
```

**错误响应**
```json
{
  "success": false,
  "error": "错误信息"
}
```

### 2. 获取消息历史

**请求**
```http
GET /api/messages
cookieId: your-cookie-id-here
```

**响应**
```json
{
  "success": true,
  "messages": [
    {
      "type": "user",
      "text": "你好",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "isError": false
    },
    {
      "type": "bot",
      "text": "你好！有什么可以帮助你的吗？",
      "timestamp": "2024-01-01T00:00:01.000Z",
      "isError": false
    }
  ]
}
```

**空响应（没有历史）**
```json
{
  "success": true,
  "messages": []
}
```

### 3. 清除消息历史

**请求**
```http
DELETE /api/messages
cookieId: your-cookie-id-here
```

**响应**
```json
{
  "success": true,
  "message": "消息已清除"
}
```

## 身份验证

所有请求都必须在 HTTP 请求头中包含 `cookieId`：

```http
cookieId: your-cookie-id-here
```

服务端应该：
1. 验证 `cookieId` 的有效性
2. 根据 `cookieId` 识别用户身份
3. 只返回/保存该用户的消息历史

## 消息格式

每条消息包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 消息类型：`"user"` 或 `"bot"` |
| `text` | `string` | 消息内容（支持 Markdown） |
| `timestamp` | `string` | ISO 8601 格式的时间戳 |
| `isError` | `boolean` | 是否为错误消息 |

## 实现示例

### Node.js + Express 示例

```javascript
const express = require('express')
const app = express()

app.use(express.json())

// 内存存储（生产环境应使用数据库）
const messageStore = new Map()

// 保存消息
app.post('/api/messages', (req, res) => {
  const cookieId = req.headers.cookieid
  if (!cookieId) {
    return res.status(401).json({ success: false, error: '未提供 cookieId' })
  }

  const { messages } = req.body
  if (!Array.isArray(messages)) {
    return res.status(400).json({ success: false, error: '消息格式错误' })
  }

  messageStore.set(cookieId, messages)
  
  res.json({
    success: true,
    message: '消息已保存',
    count: messages.length
  })
})

// 获取消息
app.get('/api/messages', (req, res) => {
  const cookieId = req.headers.cookieid
  if (!cookieId) {
    return res.status(401).json({ success: false, error: '未提供 cookieId' })
  }

  const messages = messageStore.get(cookieId) || []
  
  res.json({
    success: true,
    messages
  })
})

// 清除消息
app.delete('/api/messages', (req, res) => {
  const cookieId = req.headers.cookieid
  if (!cookieId) {
    return res.status(401).json({ success: false, error: '未提供 cookieId' })
  }

  messageStore.delete(cookieId)
  
  res.json({
    success: true,
    message: '消息已清除'
  })
})

app.listen(3399, () => {
  console.log('服务端存储服务运行在 http://localhost:3399')
})
```

### Python + Flask 示例

```python
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 内存存储（生产环境应使用数据库）
message_store = {}

@app.route('/api/messages', methods=['POST'])
def save_messages():
    cookie_id = request.headers.get('cookieId')
    if not cookie_id:
        return jsonify({'success': False, 'error': '未提供 cookieId'}), 401
    
    data = request.json
    messages = data.get('messages', [])
    
    if not isinstance(messages, list):
        return jsonify({'success': False, 'error': '消息格式错误'}), 400
    
    message_store[cookie_id] = messages
    
    return jsonify({
        'success': True,
        'message': '消息已保存',
        'count': len(messages)
    })

@app.route('/api/messages', methods=['GET'])
def get_messages():
    cookie_id = request.headers.get('cookieId')
    if not cookie_id:
        return jsonify({'success': False, 'error': '未提供 cookieId'}), 401
    
    messages = message_store.get(cookie_id, [])
    
    return jsonify({
        'success': True,
        'messages': messages
    })

@app.route('/api/messages', methods=['DELETE'])
def delete_messages():
    cookie_id = request.headers.get('cookieId')
    if not cookie_id:
        return jsonify({'success': False, 'error': '未提供 cookieId'}), 401
    
    if cookie_id in message_store:
        del message_store[cookie_id]
    
    return jsonify({
        'success': True,
        'message': '消息已清除'
    })

if __name__ == '__main__':
    app.run(port=3399, debug=True)
```

## 降级方案

如果服务端存储不可用或失败，系统会自动降级到本地存储（localStorage），确保功能可用。

## 注意事项

1. **数据安全**：生产环境应使用 HTTPS 和适当的身份验证机制
2. **数据持久化**：示例代码使用内存存储，生产环境应使用数据库（MySQL、PostgreSQL、MongoDB 等）
3. **数据清理**：建议定期清理旧数据，避免存储过大
4. **CORS 配置**：如果前端和后端不在同一域名，需要配置 CORS

## 测试

使用 curl 测试 API：

```bash
# 保存消息
curl -X POST http://localhost:3399/api/messages \
  -H "Content-Type: application/json" \
  -H "cookieId: test-user-123" \
  -d '{
    "messages": [
      {"type": "user", "text": "你好", "timestamp": "2024-01-01T00:00:00.000Z", "isError": false},
      {"type": "bot", "text": "你好！", "timestamp": "2024-01-01T00:00:01.000Z", "isError": false}
    ]
  }'

# 获取消息
curl -X GET http://localhost:3399/api/messages \
  -H "cookieId: test-user-123"

# 清除消息
curl -X DELETE http://localhost:3399/api/messages \
  -H "cookieId: test-user-123"
```

