# AI Chatbot

一个基于 Vue 3 构建的 AI 聊天机器人应用。

## 功能特性

- 💬 实时聊天界面
- 🎨 现代化的 UI 设计（类似 ChatGPT）
- 📱 响应式布局，支持移动端
- ⚡ 基于 Vite 的快速开发体验
- 🤖 支持多种 AI 模型（OpenAI、Claude、自定义 API）
- 🔧 灵活的配置系统

## 技术栈

- Vue 3 (Composition API)
- Vite
- 原生 CSS

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 配置 AI 模型

### 1. 创建环境变量文件

在项目根目录创建 `.env` 文件：

```bash
# AI 提供商配置（可选值: openai, claude, custom, local）
VITE_AI_PROVIDER=openai

# OpenAI 配置
VITE_OPENAI_API_KEY=your-openai-api-key-here
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-3.5-turbo

# Claude 配置
VITE_CLAUDE_API_KEY=your-claude-api-key-here
VITE_CLAUDE_BASE_URL=https://api.anthropic.com/v1
VITE_CLAUDE_MODEL=claude-3-haiku-20240307

# 自定义 API 配置（兼容 OpenAI 格式）
VITE_CUSTOM_API_URL=https://your-custom-api.com/v1/chat/completions
VITE_CUSTOM_API_KEY=your-custom-api-key-here
```

### 2. 获取 API Key

#### OpenAI
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册/登录账号
3. 进入 API Keys 页面创建新的 API Key
4. 将 API Key 填入 `.env` 文件的 `VITE_OPENAI_API_KEY`

#### Claude (Anthropic)
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册/登录账号
3. 创建 API Key
4. 将 API Key 填入 `.env` 文件的 `VITE_CLAUDE_API_KEY`

#### 自定义 API
如果你使用的是其他兼容 OpenAI 格式的 API（如本地部署的模型、其他云服务等），可以设置：
- `VITE_AI_PROVIDER=custom`
- `VITE_CUSTOM_API_URL` - 你的 API 端点
- `VITE_CUSTOM_API_KEY` - 你的 API Key（如果需要）

### 3. 选择 AI 提供商

在 `.env` 文件中设置 `VITE_AI_PROVIDER`：
- `openai` - 使用 OpenAI GPT 模型
- `claude` - 使用 Anthropic Claude 模型
- `custom` - 使用自定义 API
- `local` - 使用本地模型（需要本地服务）
- `mcp` - 使用 MCP (Model Context Protocol) 服务

#### MCP 服务
如果你有自己的 MCP 服务，可以设置：
- `VITE_AI_PROVIDER=mcp`
- `VITE_MCP_SERVER_URL` - 你的 MCP 服务器地址
- `VITE_MCP_API_KEY` - 你的 MCP API Key（如果需要）
- `VITE_MCP_ENABLE_TOOLS=true` - 启用工具调用
- `VITE_MCP_ENABLE_RESOURCES=true` - 启用资源访问

详细配置请参考 [MCP_SETUP.md](./MCP_SETUP.md)

### 4. 重启开发服务器

配置完成后，需要重启开发服务器：

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

## 项目结构

```
chatbot/
├── src/
│   ├── components/
│   │   └── ChatBot.vue          # 聊天机器人主组件
│   ├── services/
│   │   └── aiService.js          # AI 服务层（支持多种模型）
│   ├── App.vue                   # 根组件
│   ├── main.js                   # 入口文件
│   └── style.css                 # 全局样式
├── .env                          # 环境变量配置（需要创建）
├── index.html                    # HTML 模板
├── vite.config.js                # Vite 配置
└── package.json                   # 项目配置
```

## 支持的 AI 模型

### OpenAI
- GPT-3.5-turbo（默认）
- GPT-4
- GPT-4-turbo
- 其他 OpenAI 兼容模型

### Claude
- claude-3-haiku-20240307（默认）
- claude-3-sonnet-20240229
- claude-3-opus-20240229

### 自定义 API
支持任何兼容 OpenAI Chat Completions API 格式的服务。

### MCP (Model Context Protocol) 工具集成
支持将 MCP 服务作为工具集成到 AI 对话中：
- 自动工具识别和调用
- JSON-RPC 2.0 协议支持
- 工具参数自动提取和验证
- 支持复杂的嵌套对象参数

详细配置请参考 [MCP_TOOL_SETUP.md](./MCP_TOOL_SETUP.md)

## 故障排除

### API Key 未配置
如果看到配置错误提示，请检查：
1. `.env` 文件是否在项目根目录
2. 环境变量名称是否正确（必须以 `VITE_` 开头）
3. API Key 是否有效
4. 是否重启了开发服务器

### API 调用失败
- 检查网络连接
- 确认 API Key 有效且有足够的额度
- 查看浏览器控制台的错误信息
- 确认 API 端点 URL 正确

## 后续扩展

- [x] 集成真实的 AI API (OpenAI, Claude 等)
- [x] 集成 MCP 工具调用功能
- [ ] 添加消息历史记录（本地存储）
- [x] 支持多轮对话上下文
- [ ] 添加文件上传功能
- [ ] 实现语音输入/输出
- [ ] 添加主题切换功能
- [ ] 支持流式响应（Streaming）

## 许可证

MIT

