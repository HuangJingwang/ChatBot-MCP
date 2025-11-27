# 故障排除指南

## MCP 工具调用问题

### 问题：AI 回复说无法调用工具

**症状**：
- AI 回复类似："抱歉，我无法直接访问您的日历或帮您创建会议"
- 浏览器控制台没有工具调用相关的日志

**可能的原因和解决方法**：

#### 1. 环境变量未配置

**检查**：打开浏览器控制台（F12），查看是否有以下日志：
- `⚠️ MCP 工具功能未启用`
- `⚠️ 没有可用工具`

**解决方法**：
在 `.env` 文件中添加：
```env
VITE_ENABLE_MCP_TOOLS=true
VITE_MCP_SERVER_URL=http://your-mcp-server-url
VITE_MCP_COOKIE_ID=your-cookie-id
```

然后**重启开发服务器**：
```bash
# 停止服务器（Ctrl+C）
npm run dev
```

#### 2. MCP 服务器连接失败

**检查**：浏览器控制台是否有错误：
- `❌ 获取工具列表失败`
- `MCP 工具列表为空`

**解决方法**：
1. 确认 MCP 服务器正在运行
2. 检查 `VITE_MCP_SERVER_URL` 是否正确
3. 检查网络连接
4. 确认服务器支持 CORS（如果从浏览器直接调用）

#### 3. Cookie ID 未配置或无效

**检查**：浏览器控制台是否有警告：
- `⚠️ MCP Cookie ID 未配置`

**解决方法**：
1. 在 `.env` 文件中设置 `VITE_MCP_COOKIE_ID`
2. 确认 Cookie ID 有效
3. 检查 MCP 服务器的身份验证逻辑

#### 4. 工具列表为空

**检查**：浏览器控制台日志：
- `✅ 获取到的 MCP 工具数量: 0`

**解决方法**：
1. 确认 MCP 服务器实现了 `tools/list` 方法
2. 检查 JSON-RPC 响应格式是否正确
3. 确认工具列表不为空

#### 5. AI 没有识别需要调用工具

**检查**：浏览器控制台日志：
- `⚠️ AI 没有调用工具`

**解决方法**：
1. **改进工具描述**：确保工具描述清晰说明工具的用途
   ```json
   {
     "name": "meeting_create",
     "description": "创建一个新的会议。可以设置会议标题、主持人、开始时间等信息。"
   }
   ```

2. **使用更明确的用户消息**：
   - ❌ 不好："帮我安排一个会议"
   - ✅ 好："使用 meeting_create 工具创建一个会议，标题是项目讨论会"

3. **检查工具 Schema**：确保 `inputSchema` 完整且正确

#### 6. 工具调用失败

**检查**：浏览器控制台是否有错误：
- `❌ 工具调用失败`

**解决方法**：
1. 检查工具参数是否正确
2. 确认所有必需字段都有值
3. 检查 MCP 服务器的 `tools/call` 方法实现
4. 查看详细的错误信息

## 调试步骤

### 步骤 1：检查环境变量

打开浏览器控制台，查看日志：
```
🔧 MCP 工具配置检查: {
  enableMCPTools: true/false,
  mcpServerUrl: "...",
  hasCookieId: true/false
}
```

如果 `enableMCPTools` 为 `false`，检查 `.env` 文件。

### 步骤 2：检查工具列表获取

查看日志：
```
📡 正在获取 MCP 工具列表...
✅ 获取到的 MCP 工具数量: X
```

如果数量为 0，检查 MCP 服务器连接。

### 步骤 3：检查工具是否传递给 AI

查看日志：
```
🔧 将工具添加到 OpenAI 请求中，工具数量: X
```

如果数量为 0，说明工具列表获取失败。

### 步骤 4：检查 AI 是否调用工具

查看日志：
```
🔧 AI 请求调用工具: ["tool_name"]
```

如果没有这个日志，说明 AI 没有识别需要调用工具。

### 步骤 5：检查工具调用结果

查看日志：
```
✅ 工具调用完成，结果数量: X
```

如果出现错误，查看详细的错误信息。

## 常见错误信息

### "MCP 工具功能未启用"
- **原因**：`VITE_ENABLE_MCP_TOOLS` 未设置为 `true`
- **解决**：在 `.env` 文件中设置 `VITE_ENABLE_MCP_TOOLS=true`

### "MCP Cookie ID 未配置"
- **原因**：`VITE_MCP_COOKIE_ID` 未设置
- **解决**：在 `.env` 文件中设置 `VITE_MCP_COOKIE_ID=your-cookie-id`

### "获取工具列表失败"
- **原因**：无法连接到 MCP 服务器或服务器返回错误
- **解决**：检查服务器 URL、网络连接、服务器状态

### "MCP 工具列表为空"
- **原因**：MCP 服务器返回的工具列表为空
- **解决**：检查服务器的 `tools/list` 实现

### "工具调用失败"
- **原因**：工具执行时出错
- **解决**：检查工具参数、服务器实现、查看详细错误

## 测试 MCP 服务器

可以使用以下命令测试 MCP 服务器：

```bash
# 测试初始化
curl -X POST http://your-mcp-server/tools/list \
  -H "Content-Type: application/json" \
  -H "cookieId: your-cookie-id" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {}
  }'

# 测试获取工具列表
curl -X POST http://your-mcp-server/tools/list \
  -H "Content-Type: application/json" \
  -H "cookieId: your-cookie-id" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

## 需要帮助？

如果以上方法都无法解决问题，请：
1. 查看浏览器控制台的完整错误日志
2. 检查网络请求（Network 标签）
3. 确认 MCP 服务器日志
4. 提供详细的错误信息和配置

