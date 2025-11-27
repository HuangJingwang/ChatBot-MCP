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
        <h1 class="empty-title">ChatGPT</h1>
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

      <!-- 消息列表 -->
      <div 
        v-for="(message, index) in messages" 
        :key="index"
        :class="['message-wrapper', message.type]"
      >
        <div class="message-container">
          <div class="message-avatar">
            <svg v-if="message.type === 'bot'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
            </svg>
          </div>
          <div class="message-content">
            <div 
              class="message-text" 
              v-html="formatMessage(message.text)"
              :data-error="message.isError"
            ></div>
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
            @input="handleInput"
            placeholder="Message ChatGPT..."
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
          <span class="footer-text">ChatGPT can make mistakes. Check important info.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { callAI, checkConfig } from '../services/aiService'

const messages = ref([])
const inputMessage = ref('')
const isTyping = ref(false)
const messagesContainer = ref(null)
const inputRef = ref(null)
const errorMessage = ref('')

const suggestions = [
  '解释一下量子计算',
  '写一首关于春天的诗',
  '如何学习编程？',
  '给我讲个笑话'
]

const formatMessage = (text) => {
  // 简单的格式化：将换行符转换为 <br>
  return text.replace(/\n/g, '<br>')
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
  } finally {
    isTyping.value = false
    scrollToBottom()
  }
}

onMounted(() => {
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
  padding: 0;
  display: flex;
  flex-direction: column;
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
  padding: 40px 20px;
  max-width: 768px;
  margin: 0 auto;
  width: 100%;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #8e8ea0;
  margin-bottom: 20px;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-title {
  font-size: 32px;
  font-weight: 600;
  color: #202123;
  margin: 0 0 40px 0;
  text-align: center;
}

.empty-suggestions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 600px;
}

.suggestion-button {
  padding: 12px 16px;
  background: #f7f7f8;
  border: 1px solid #e5e5e6;
  border-radius: 12px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
}

.suggestion-button:hover {
  background: #ececf1;
  border-color: #d1d5db;
}

/* 消息样式 */
.message-wrapper {
  width: 100%;
  padding: 20px 0;
  border-bottom: 1px solid #e5e5e6;
  animation: fadeIn 0.3s ease-in;
}

.message-wrapper.bot {
  background: #ffffff;
}

.message-wrapper.user {
  background: #f7f7f8;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-container {
  max-width: 768px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.message-avatar {
  width: 30px;
  height: 30px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4px;
}

.message-wrapper.bot .message-avatar {
  background: #19c37d;
  color: white;
}

.message-wrapper.user .message-avatar {
  background: #5436da;
  color: white;
}

.message-avatar svg {
  width: 18px;
  height: 18px;
}

.message-content {
  flex: 1;
  padding-top: 4px;
}

.message-text {
  font-size: 16px;
  line-height: 1.75;
  color: #374151;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message-wrapper.user .message-text {
  color: #374151;
}

/* 错误消息样式 */
.message-wrapper.bot .message-content .message-text[data-error] {
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
  padding: 12px 0;
  background: #ffffff;
  border-top: 1px solid #e5e5e6;
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
  transition: all 0.2s;
}

.input-container:focus-within {
  border-color: #10a37f;
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.1);
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
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
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
  opacity: 0.4;
  cursor: not-allowed;
}

.send-button svg {
  width: 20px;
  height: 20px;
}

.send-button:not(.disabled) {
  background: #19c37d;
  color: white;
}

.send-button:not(.disabled):hover {
  background: #15a06a;
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
