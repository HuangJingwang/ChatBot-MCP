<template>
  <div class="chatbot-container">
    <!-- 消息区域 -->
    <div class="chatbot-messages" ref="messagesContainer">
      <!-- 空状态 -->
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="empty-title">ChatBot</h1>
        <div class="empty-suggestions">
          <button 
            v-for="(suggestion, index) in suggestions" 
            :key="index"
            @click="sendSuggestion(suggestion)"
            class="suggestion-button"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <!-- 清除历史按钮 - 只在有消息时显示 -->
      <div v-if="messages.length > 0" class="clear-history-container">
        <button @click="showClearConfirm = true" class="clear-history-button" title="清除对话历史">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
          </svg>
          <span>清除历史</span>
        </button>
      </div>

      <!-- 自定义确认对话框 -->
      <div v-if="showClearConfirm" class="confirm-dialog-overlay" @click.self="showClearConfirm = false">
        <div class="confirm-dialog">
          <div class="confirm-dialog-header">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="confirm-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            </svg>
            <h3 class="confirm-title">清除对话历史</h3>
          </div>
          <div class="confirm-content">
            <p>确定要清除所有对话历史吗？</p>
            <p class="confirm-warning">此操作不可恢复，所有消息将被永久删除。</p>
          </div>
          <div class="confirm-actions">
            <button @click="showClearConfirm = false" class="confirm-button cancel-button">
              取消
            </button>
            <button @click="handleClearConfirm" class="confirm-button confirm-button-primary">
              确定清除
            </button>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div 
        v-for="(message, index) in messages" 
        :key="index"
        :class="['message-wrapper', message.type]"
      >
        <div class="message-container">
          <div class="message-avatar">
            <!-- AI 助手头像 -->
            <img 
              v-if="message.type === 'bot' && botAvatarSrc" 
              :src="botAvatarSrc" 
              alt="AI Assistant"
              @error="botAvatarSrc = null"
              class="avatar-image"
            />
            <!-- AI 助手卡通头像 - 友好机器人（备用） -->
            <svg v-else-if="message.type === 'bot'" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <!-- 紫色渐变圆形背景 -->
              <defs>
                <linearGradient id="botGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="48" fill="url(#botGradient)" stroke="#000" stroke-width="2.5"/>
              
              <!-- 机器人头部（圆角矩形） -->
              <rect x="28" y="28" width="44" height="38" rx="6" fill="#ffffff" stroke="#000" stroke-width="2.5"/>
              
              <!-- 机器人天线（带信号波） -->
              <circle cx="50" cy="18" r="5" fill="#ffd700" stroke="#000" stroke-width="2"/>
              <line x1="50" y1="18" x2="50" y2="28" stroke="#000" stroke-width="2.5" stroke-linecap="round"/>
              <!-- 信号波装饰 -->
              <path d="M 50 18 Q 55 15 60 18" stroke="#ffd700" stroke-width="2" fill="none" stroke-linecap="round"/>
              
              <!-- 左眼（大而友好） -->
              <circle cx="40" cy="42" r="6" fill="#667eea" stroke="#000" stroke-width="2.5"/>
              <circle cx="40" cy="42" r="4" fill="#ffffff"/>
              <circle cx="40.5" cy="41.5" r="2" fill="#000"/>
              <!-- 高光 -->
              <circle cx="39" cy="40.5" r="1" fill="#ffffff" opacity="0.8"/>
              
              <!-- 右眼（大而友好） -->
              <circle cx="60" cy="42" r="6" fill="#667eea" stroke="#000" stroke-width="2.5"/>
              <circle cx="60" cy="42" r="4" fill="#ffffff"/>
              <circle cx="60.5" cy="41.5" r="2" fill="#000"/>
              <!-- 高光 -->
              <circle cx="59" cy="40.5" r="1" fill="#ffffff" opacity="0.8"/>
              
              <!-- 嘴巴（开心的微笑） -->
              <path d="M 42 52 Q 50 58 58 52" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              
              <!-- 机器人身体 -->
              <rect x="32" y="66" width="36" height="22" rx="4" fill="#ffffff" stroke="#000" stroke-width="2.5"/>
              
              <!-- 身体装饰（三个圆形按钮，带渐变） -->
              <circle cx="42" cy="75" r="3" fill="#667eea" stroke="#000" stroke-width="1.5"/>
              <circle cx="50" cy="75" r="3" fill="#667eea" stroke="#000" stroke-width="1.5"/>
              <circle cx="58" cy="75" r="3" fill="#667eea" stroke="#000" stroke-width="1.5"/>
              
              <!-- 装饰线条 -->
              <line x1="38" y1="82" x2="62" y2="82" stroke="#667eea" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <!-- 用户头像 - 使用图片 -->
            <img 
              v-else-if="userAvatarSrc" 
              :src="userAvatarSrc" 
              alt="User"
              @error="userAvatarSrc = null"
              class="avatar-image"
            />
            <!-- 用户卡通头像（备用） -->
            <svg v-else viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <!-- 蓝色圆形背景 -->
              <circle cx="50" cy="50" r="48" fill="#3b82f6" stroke="#000" stroke-width="2.5"/>
              <!-- 头部（浅肤色） -->
              <circle cx="50" cy="42" r="18" fill="#fdbcb4" stroke="#000" stroke-width="2.5"/>
              <!-- 头发（深棕色，向右倾斜） -->
              <path d="M 32 28 Q 38 20 50 24 Q 62 20 68 28 Q 68 24 63 22 Q 50 16 37 22 Q 32 24 32 28 Z" fill="#8b4513" stroke="#000" stroke-width="2.5"/>
              <!-- 左耳 -->
              <ellipse cx="35" cy="45" rx="3.5" ry="5" fill="#fdbcb4" stroke="#000" stroke-width="2.5"/>
              <!-- 右耳 -->
              <ellipse cx="65" cy="45" rx="3.5" ry="5" fill="#fdbcb4" stroke="#000" stroke-width="2.5"/>
              <!-- 左眼（黑色椭圆） -->
              <ellipse cx="45" cy="40" rx="2.5" ry="3.5" fill="#000"/>
              <!-- 右眼（黑色椭圆） -->
              <ellipse cx="55" cy="40" rx="2.5" ry="3.5" fill="#000"/>
              <!-- 嘴巴（微笑曲线） -->
              <path d="M 45 48 Q 50 53 55 48" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <!-- 衣服（黄色/金色上衣，圆领） -->
              <path d="M 42 60 Q 50 68 58 60 L 58 75 L 42 75 Z" fill="#ffd700" stroke="#000" stroke-width="2.5"/>
              <!-- 领口 -->
              <ellipse cx="50" cy="60" rx="8" ry="3" fill="#fdbcb4" stroke="#000" stroke-width="2"/>
            </svg>
          </div>
          <div class="message-content">
            <div 
              class="message-text" 
              v-html="formatMessage(message.text)"
              :data-error="message.isError ? 'true' : undefined"
            ></div>
            <!-- 复制按钮 - 仅AI消息显示 -->
            <div v-if="message.type === 'bot'" class="message-actions">
              <button 
                @click="copyMessage(message.text, index)"
                class="copy-button"
                :title="copiedMessageId === index ? '已复制' : '复制'"
              >
                <svg v-if="copiedMessageId !== index" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 打字指示器 -->
      <div v-if="isTyping" class="message-wrapper bot">
        <div class="message-container">
          <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-banner">
      <div class="error-content">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
        </svg>
        <span>{{ errorMessage }}</span>
        <button @click="errorMessage = ''" class="error-close">×</button>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chatbot-input-wrapper">
      <div class="chatbot-input-container">
        <div class="input-container">
          <textarea
            v-model="inputMessage"
            @keydown.enter.exact.prevent="handleEnter"
            @keydown.shift.enter.exact="handleShiftEnter"
            @compositionstart="isComposing = true"
            @compositionend="isComposing = false"
            @input="handleInput"
            placeholder="Message ChatBot..."
            rows="1"
            :disabled="isTyping"
            ref="inputRef"
            class="message-input"
          ></textarea>
          <button 
            @click="sendMessage" 
            :disabled="!inputMessage.trim() || isTyping"
            :class="['send-button', { 'disabled': !inputMessage.trim() || isTyping }]"
            title="Send message"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <div class="input-footer">
          <span class="footer-text">ChatBot can make mistakes. Check important info.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'
import { callAI, checkConfig } from '../services/aiService'
import { saveMessages, loadMessages, clearMessages, hasStoredMessages } from '../services/memoryService'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

// 初始化 Markdown 渲染器
const md = new MarkdownIt({
  html: true, // 允许 HTML 标签
  linkify: true, // 自动识别链接
  typographer: true, // 启用一些语言中性的替换 + 引号美化
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>'
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  }
})

const messages = ref([])
const inputMessage = ref('')
const isTyping = ref(false)
const messagesContainer = ref(null)
const inputRef = ref(null)
const errorMessage = ref('')
const isComposing = ref(false) // 输入法状态
const copiedMessageId = ref(null) // 已复制的消息ID
const showClearConfirm = ref(false) // 显示清除确认对话框

// 头像配置 - 使用 public 目录下的图片
// 将你的头像图片放在 public/avatars/ 目录下，命名为 user-avatar.png
// 图片路径会自动从 public 目录加载，如果图片不存在会自动使用 SVG 备用头像
const userAvatarSrc = ref('/avatars/user-avatar.png')
const botAvatarSrc = ref(null)
const showBotAvatar = ref(false)

const suggestions = [
  '解释一下量子计算',
  '写一首关于春天的诗',
  '如何学习编程？',
  '给我讲个笑话'
]

const formatMessage = (text) => {
  if (!text) return ''
  // 使用 Markdown 渲染器
  return md.render(text)
}

// 复制消息内容
const copyMessage = async (text, index) => {
  try {
    // 移除 HTML 标签，获取纯文本
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = text
    const plainText = tempDiv.textContent || tempDiv.innerText || ''
    
    // 使用 Clipboard API 复制
    await navigator.clipboard.writeText(plainText)
    
    // 显示复制成功反馈
    copiedMessageId.value = index
    setTimeout(() => {
      copiedMessageId.value = null
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案：使用传统方法
    const textArea = document.createElement('textarea')
    textArea.value = text.replace(/<[^>]*>/g, '') // 移除HTML标签
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      copiedMessageId.value = index
      setTimeout(() => {
        copiedMessageId.value = null
      }, 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
    document.body.removeChild(textArea)
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const handleInput = (e) => {
  // 自动调整 textarea 高度
  const textarea = e.target
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
}

const handleEnter = () => {
  // 如果正在使用输入法（中文输入等），不触发发送
  if (isComposing.value) {
    return
  }
  if (!isTyping.value && inputMessage.value.trim()) {
    sendMessage()
  }
}

const handleShiftEnter = () => {
  // Shift+Enter 换行，不做任何处理
}

const sendSuggestion = (suggestion) => {
  inputMessage.value = suggestion
  sendMessage()
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isTyping.value) return

  const userMessage = {
    type: 'user',
    text: inputMessage.value.trim(),
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  const userInput = userMessage.text
  inputMessage.value = ''
  errorMessage.value = ''
  
  // 重置 textarea 高度
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
  
  // 自动保存消息（watch 会触发，但这里也显式保存以确保及时性）
  await saveMessages(messages.value)
  
  scrollToBottom()

  // 调用真实的 AI API
  isTyping.value = true
  scrollToBottom()

  try {
    // 检查配置
    const configCheck = checkConfig()
    if (!configCheck.valid) {
      throw new Error(`配置错误：${configCheck.issues.join(', ')}\n\n请在项目根目录创建 .env 文件并配置相应的 API Key。`)
    }

    // 智能工具匹配：在发送给 AI 之前，先检查是否需要调用工具
    if (import.meta.env.VITE_ENABLE_MCP_TOOLS === 'true') {
      const { matchToolByUserMessage } = await import('../services/mcpToolService.js')
      const matchResult = await matchToolByUserMessage(userInput)
      
      if (matchResult.matched) {
        console.log(`🎯 检测到用户意图可能需要工具: ${matchResult.tool.name} (置信度: ${matchResult.confidence})`)
        // 这个信息会在 callCustom 中被使用，在系统消息中提示 AI
      }
    }

    // 调用 AI 服务
    const botResponse = await callAI(messages.value)
    
    messages.value.push({
      type: 'bot',
      text: botResponse,
      timestamp: new Date()
    })
    
    // 保存 AI 回复
    await saveMessages(messages.value)
  } catch (error) {
    console.error('AI 调用失败:', error)
    errorMessage.value = error.message || 'AI 服务调用失败，请检查配置和网络连接。'
    
    // 显示错误消息给用户
    messages.value.push({
      type: 'bot',
      text: `抱歉，发生了错误：\n\n${error.message}\n\n请检查你的 API 配置是否正确。`,
      timestamp: new Date(),
      isError: true
    })
    
    // 保存错误消息
    await saveMessages(messages.value)
  } finally {
    isTyping.value = false
    scrollToBottom()
  }
}

// 处理清除确认
const handleClearConfirm = async () => {
  showClearConfirm.value = false
  messages.value = []
  await clearMessages()
  scrollToBottom()
}

// 监听消息变化，自动保存
watch(messages, async (newMessages) => {
  // 只有在消息数量大于0时才保存（避免初始化时清空）
  if (newMessages.length > 0) {
    await saveMessages(newMessages)
  }
}, { deep: true })

onMounted(async () => {
  // 加载历史消息（优先从服务端加载）
  const savedMessages = await loadMessages()
  if (savedMessages.length > 0) {
    messages.value = savedMessages
    console.log(`✅ 已恢复 ${savedMessages.length} 条历史消息`)
    // 等待 DOM 更新后滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  }
  
  // 检查头像图片
  const checkImageExists = (url, type) => {
    const img = new Image()
    img.onload = () => {
      if (type === 'user') userAvatarSrc.value = url
      else if (type === 'bot') botAvatarSrc.value = url
    }
    img.onerror = () => {
      if (type === 'user') userAvatarSrc.value = null
      else if (type === 'bot') botAvatarSrc.value = null
      console.log(`${type} 头像图片未找到或加载失败，使用 SVG 备用`)
    }
    img.src = url
  }
  
  checkImageExists(userAvatarSrc.value, 'user')
  checkImageExists(botAvatarSrc.value, 'bot')
  
  if (inputRef.value) {
    inputRef.value.focus()
  }
})
</script>

<style scoped>
.chatbot-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  position: relative;
}

.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.chatbot-messages::-webkit-scrollbar {
  width: 8px;
}

.chatbot-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chatbot-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.chatbot-messages::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  max-width: 768px;
  margin: 0 auto;
  width: 100%;
}

.empty-icon {
  width: 56px;
  height: 56px;
  color: #9ca3af;
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-title {
  font-size: 28px;
  font-weight: 600;
  color: #202123;
  margin: 0 0 32px 0;
  text-align: center;
  letter-spacing: -0.5px;
}

.empty-suggestions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 640px;
}

.suggestion-button {
  padding: 14px 18px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: inherit;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.suggestion-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

/* 清除历史按钮 */
.clear-history-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
}

.clear-history-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.clear-history-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.clear-history-button svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.clear-history-button span {
  white-space: nowrap;
}

/* 确认对话框 */
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.confirm-dialog {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirm-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.confirm-icon {
  width: 24px;
  height: 24px;
  color: #ef4444;
  flex-shrink: 0;
}

.confirm-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  line-height: 1.5;
}

.confirm-content {
  padding: 20px 24px;
}

.confirm-content p {
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 1.6;
  color: #374151;
}

.confirm-content p:last-child {
  margin-bottom: 0;
}

.confirm-warning {
  color: #dc2626 !important;
  font-size: 14px !important;
  font-weight: 500;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
  justify-content: flex-end;
}

.confirm-button {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-family: inherit;
}

.cancel-button {
  background: #f9fafb;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.cancel-button:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.confirm-button-primary {
  background: #ef4444;
  color: #ffffff;
}

.confirm-button-primary:hover {
  background: #dc2626;
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
}

.confirm-button-primary:active {
  transform: scale(0.98);
}

/* 消息样式 */
.message-wrapper {
  width: 100%;
  padding: 12px 0;
  animation: fadeIn 0.3s ease-in;
}

.message-wrapper.bot {
  background: #ffffff;
}

.message-wrapper.user {
  background: #ffffff;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-container {
  max-width: 768px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  gap: 0;
  align-items: flex-start;
  box-sizing: border-box;
}

/* AI 消息靠左 */
.message-wrapper.bot .message-container {
  justify-content: flex-start;
}

/* 用户消息靠右 */
.message-wrapper.user .message-container {
  justify-content: flex-end;
}

.message-avatar {
  display: none !important;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.message-wrapper.bot .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-wrapper.user .message-avatar {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.message-avatar svg {
  width: 100%;
  height: 100%;
  padding: 8px;
}

.message-content {
  min-width: 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  flex: 0 1 auto;
  width: auto;
}

/* AI 消息靠左，自适应 */
.message-wrapper.bot .message-content {
  max-width: 100%;
  margin-right: auto;
}

/* 用户消息从右向左自适应 */
.message-wrapper.user .message-content {
  max-width: 100%;
  margin-left: auto;
  text-align: right;
}

/* 消息操作按钮 */
.message-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-wrapper:hover .message-actions {
  opacity: 1;
}

.copy-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: #8e8ea0;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.copy-button:hover {
  background: #f7f7f8;
  color: #353740;
}

.copy-button svg {
  width: 16px;
  height: 16px;
}

.message-text {
  font-size: 16px;
  line-height: 1.75;
  color: #353740;
  word-wrap: break-word;
  padding: 14px 18px;
  border-radius: 12px;
  background: #f7f7f8;
  margin: 0;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

/* 用户消息气泡 - 缩小内边距，减少上下空白 */
.message-wrapper.user .message-text {
  padding: 6px 12px;
}

/* AI 消息样式 - 无背景 */
.message-wrapper.bot .message-text {
  background: transparent;
  color: #353740;
  border-bottom-left-radius: 4px;
  padding: 14px 0;
}

/* 用户消息样式 - 灰色背景 */
.message-wrapper.user .message-text {
  background: #f7f7f8;
  color: #353740 !important;
  border-radius: 12px;
  text-align: left;
  width: auto;
  display: inline-block;
}

/* 确保用户消息内的所有文本颜色一致 */
.message-wrapper.user .message-text,
.message-wrapper.user .message-text *,
.message-wrapper.user .message-text :deep(*) {
  color: #353740 !important;
}

/* 用户消息中的 Markdown 元素颜色调整 */
.message-wrapper.user .message-text :deep(p),
.message-wrapper.user .message-text :deep(li),
.message-wrapper.user .message-text :deep(h1),
.message-wrapper.user .message-text :deep(h2),
.message-wrapper.user .message-text :deep(h3),
.message-wrapper.user .message-text :deep(h4),
.message-wrapper.user .message-text :deep(h5),
.message-wrapper.user .message-text :deep(h6),
.message-wrapper.user .message-text :deep(span),
.message-wrapper.user .message-text :deep(div) {
  color: #353740 !important;
}

/* Markdown 样式 */
.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3),
.message-text :deep(h4),
.message-text :deep(h5),
.message-text :deep(h6) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
}

.message-text :deep(h1) { font-size: 1.5em; }
.message-text :deep(h2) { font-size: 1.3em; }
.message-text :deep(h3) { font-size: 1.1em; }

.message-text :deep(p) {
  margin: 0.5em 0;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.message-text :deep(li) {
  margin: 0.25em 0;
}

.message-text :deep(blockquote) {
  margin: 0.5em 0;
  padding-left: 1em;
  border-left: 3px solid #d1d5db;
  color: #6b7280;
  font-style: italic;
}

.message-text :deep(code) {
  background: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #e11d48;
}

.message-text :deep(pre) {
  background: #1e293b;
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.5em 0;
}

.message-text :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #e2e8f0;
  font-size: 0.9em;
}

.message-text :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.message-text :deep(a:hover) {
  color: #2563eb;
}

.message-text :deep(table) {
  border-collapse: collapse;
  margin: 0.5em 0;
  width: 100%;
}

.message-text :deep(th),
.message-text :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.5em;
  text-align: left;
}

.message-text :deep(th) {
  background: #f9fafb;
  font-weight: 600;
}

.message-text :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1em 0;
}

.message-text :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 0.5em 0;
}

.message-wrapper.user .message-text {
  color: #353740 !important;
}

/* 用户消息中的 Markdown 元素颜色调整 */
.message-wrapper.user .message-text :deep(p),
.message-wrapper.user .message-text :deep(li),
.message-wrapper.user .message-text :deep(h1),
.message-wrapper.user .message-text :deep(h2),
.message-wrapper.user .message-text :deep(h3),
.message-wrapper.user .message-text :deep(h4),
.message-wrapper.user .message-text :deep(h5),
.message-wrapper.user .message-text :deep(h6) {
  color: #353740 !important;
}

.message-wrapper.user .message-text :deep(code) {
  background: rgba(0, 0, 0, 0.05);
  color: #353740 !important;
}

.message-wrapper.user .message-text :deep(pre) {
  background: rgba(0, 0, 0, 0.05);
}

.message-wrapper.user .message-text :deep(pre code) {
  color: #353740 !important;
}

.message-wrapper.user .message-text :deep(a) {
  color: #353740 !important;
  text-decoration: underline;
}

/* 错误消息样式 - 只匹配 data-error="true" 的消息 */
.message-wrapper.bot .message-content .message-text[data-error="true"] {
  color: #dc2626;
  background: #fef2f2;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 3px solid #dc2626;
}

/* 错误横幅 */
.error-banner {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 600px;
  width: calc(100% - 40px);
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 16px;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.error-content {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #991b1b;
  font-size: 14px;
}

.error-content svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.error-content span {
  flex: 1;
  line-height: 1.5;
}

.error-close {
  background: none;
  border: none;
  color: #991b1b;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.error-close:hover {
  background: rgba(153, 27, 27, 0.1);
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

/* 输入区域 */
.chatbot-input-wrapper {
  width: 100%;
  padding: 16px 0 20px 0;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
}

.chatbot-input-container {
  max-width: 768px;
  margin: 0 auto;
  padding: 0 24px;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 24px;
  padding: 12px 16px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.input-container:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 2px 4px rgba(0, 0, 0, 0.08);
}

.message-input {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 16px;
  line-height: 24px;
  color: #374151;
  background: transparent;
  font-family: inherit;
  max-height: 200px;
  overflow-y: auto;
}

.message-input::placeholder {
  color: #9ca3af;
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
}

.send-button:not(.disabled):hover {
  background: #f3f4f6;
  color: #374151;
}

.send-button:not(.disabled):active {
  transform: scale(0.95);
}

.send-button.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.send-button svg {
  width: 18px;
  height: 18px;
}

.send-button:not(.disabled) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.send-button:not(.disabled):hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

.input-footer {
  margin-top: 8px;
  text-align: center;
}

.footer-text {
  font-size: 12px;
  color: #9ca3af;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-container {
    padding: 0 16px;
    gap: 16px;
  }

  .chatbot-input-container {
    padding: 0 16px;
  }

  .empty-suggestions {
    grid-template-columns: 1fr;
  }

  .empty-title {
    font-size: 24px;
  }
}
</style>
