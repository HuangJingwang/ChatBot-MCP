# OpenAI 配置指南

本指南将帮助你配置 OpenAI API，让你的 chatbot 使用真实的 GPT 模型。

## 步骤 1: 获取 OpenAI API Key

### 1.1 注册/登录 OpenAI 账号

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 点击 "Sign up" 注册新账号，或 "Log in" 登录已有账号
3. 完成账号验证（可能需要手机号验证）

### 1.2 创建 API Key

1. 登录后，点击右上角的头像或你的名字
2. 选择 "API keys" 或直接访问 [API Keys 页面](https://platform.openai.com/api-keys)
3. 点击 "Create new secret key" 按钮
4. 给这个 Key 起个名字（可选，如 "Chatbot Project"）
5. 点击 "Create secret key"
6. **重要**：立即复制这个 API Key，因为它只会显示一次！格式类似：`sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 1.3 充值账户（如果需要）

1. 访问 [Billing 页面](https://platform.openai.com/account/billing)
2. 点击 "Add payment method" 添加支付方式
3. 充值一定金额（OpenAI 按使用量计费）

## 步骤 2: 创建 .env 文件

在项目根目录（`/Users/mac26/workspace/chatbot/`）创建 `.env` 文件：

```bash
# 方法 1: 使用命令行创建
cd /Users/mac26/workspace/chatbot
cp env.example .env

# 方法 2: 手动创建
touch .env
```

## 步骤 3: 配置环境变量

打开 `.env` 文件，添加以下配置：

```env
# 设置使用 OpenAI 作为 AI 提供商
VITE_AI_PROVIDER=openai

# 填入你的 OpenAI API Key（替换下面的值）
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here

# OpenAI API 基础 URL（通常不需要修改）
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

# 选择要使用的模型（可选，默认是 gpt-3.5-turbo）
VITE_OPENAI_MODEL=gpt-3.5-turbo
```

### 配置项说明

| 配置项 | 说明 | 必填 | 默认值 |
|--------|------|------|--------|
| `VITE_AI_PROVIDER` | AI 提供商，设置为 `openai` | ✅ | `openai` |
| `VITE_OPENAI_API_KEY` | 你的 OpenAI API Key | ✅ | 无 |
| `VITE_OPENAI_BASE_URL` | API 基础 URL | ❌ | `https://api.openai.com/v1` |
| `VITE_OPENAI_MODEL` | 使用的模型名称 | ❌ | `gpt-3.5-turbo` |

### 可用的 OpenAI 模型

你可以根据需要选择不同的模型：

```env
# GPT-3.5 系列（推荐，性价比高）
VITE_OPENAI_MODEL=gpt-3.5-turbo

# GPT-4 系列（更强大，但更贵）
VITE_OPENAI_MODEL=gpt-4
VITE_OPENAI_MODEL=gpt-4-turbo-preview
VITE_OPENAI_MODEL=gpt-4-0125-preview

# GPT-4o（最新，更快）
VITE_OPENAI_MODEL=gpt-4o
VITE_OPENAI_MODEL=gpt-4o-mini
```

## 步骤 4: 完整的 .env 文件示例

```env
# ============================================
# AI 提供商配置
# ============================================
VITE_AI_PROVIDER=openai

# ============================================
# OpenAI 配置
# ============================================
# 你的 OpenAI API Key（从 https://platform.openai.com/api-keys 获取）
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI API 基础 URL（通常不需要修改）
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

# 使用的模型（可选，默认 gpt-3.5-turbo）
VITE_OPENAI_MODEL=gpt-3.5-turbo
```

## 步骤 5: 重启开发服务器

配置完成后，**必须重启开发服务器**才能生效：

```bash
# 1. 停止当前运行的服务器（按 Ctrl+C）

# 2. 重新启动
npm run dev
```

## 步骤 6: 验证配置

1. 打开浏览器访问 `http://localhost:3000`
2. 在输入框中发送一条消息
3. 如果配置正确，你应该能看到 AI 的真实回复
4. 如果出现错误，查看浏览器控制台（F12）的错误信息

## 常见问题

### ❌ 错误：OpenAI API Key 未配置

**原因**：`.env` 文件中没有正确设置 API Key

**解决方法**：
1. 检查 `.env` 文件是否在项目根目录
2. 确认 `VITE_OPENAI_API_KEY` 的值是否正确（不要有多余的空格）
3. 确认 API Key 以 `sk-` 开头
4. 重启开发服务器

### ❌ 错误：Incorrect API key provided

**原因**：API Key 无效或已过期

**解决方法**：
1. 登录 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 检查 API Key 是否仍然有效
3. 如果无效，创建新的 API Key 并更新 `.env` 文件
4. 重启开发服务器

### ❌ 错误：You exceeded your current quota

**原因**：账户余额不足

**解决方法**：
1. 访问 [OpenAI Billing](https://platform.openai.com/account/billing)
2. 检查账户余额
3. 如果需要，添加支付方式并充值

### ❌ 错误：Network error 或 CORS error

**原因**：网络问题或 API 端点配置错误

**解决方法**：
1. 检查网络连接
2. 确认 `VITE_OPENAI_BASE_URL` 正确
3. 如果在中国大陆，可能需要使用代理或 VPN

## 使用代理（可选）

如果你需要通过代理访问 OpenAI API，可以配置：

```env
# 使用自定义代理（需要后端支持）
VITE_OPENAI_BASE_URL=https://your-proxy-server.com/v1
```

或者，你可以创建一个后端服务来转发请求，避免 CORS 问题。

## 安全提示

⚠️ **重要安全提示**：

1. **永远不要**将 `.env` 文件提交到 Git 仓库
2. `.env` 文件已经在 `.gitignore` 中，确保不会被提交
3. 如果 API Key 泄露，立即在 OpenAI 平台删除并创建新的
4. 在生产环境中，使用环境变量或密钥管理服务，而不是硬编码

## 下一步

配置完成后，你可以：
- 尝试不同的模型（GPT-4 等）
- 调整温度参数（在 `aiService.js` 中）
- 添加流式响应支持
- 实现消息历史持久化

祝你使用愉快！🚀

