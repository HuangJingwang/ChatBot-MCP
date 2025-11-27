/**
 * 对话记忆服务 - 持久化存储对话历史
 * 支持服务端存储（跨页面/跨设备）和本地存储（降级方案）
 */

import { 
  saveMessagesToServer, 
  loadMessagesFromServer, 
  clearMessagesFromServer,
  isServerStorageAvailable 
} from './serverMemoryService.js'

const STORAGE_KEY = 'chatbot_messages'
const MAX_HISTORY_LENGTH = 50 // 最大保存的消息数量（避免存储过大）

/**
 * 保存对话历史（优先服务端，失败则降级到本地）
 * @param {Array} messages - 消息数组
 */
export const saveMessages = async (messages) => {
  // 只保存最近的 N 条消息
  const messagesToSave = messages.slice(-MAX_HISTORY_LENGTH)
  
  // 转换消息格式，确保可以序列化
  const serializableMessages = messagesToSave.map(msg => ({
    type: msg.type,
    text: msg.text,
    timestamp: msg.timestamp ? msg.timestamp.toISOString() : new Date().toISOString(),
    isError: msg.isError || false
  }))

  // 优先尝试保存到服务端
  if (isServerStorageAvailable()) {
    const serverSuccess = await saveMessagesToServer(serializableMessages)
    if (serverSuccess) {
      // 服务端保存成功，同时保存到本地作为备份
      saveMessagesToLocal(serializableMessages)
      return
    }
    // 服务端保存失败，降级到本地存储
    console.warn('⚠️ 服务端保存失败，降级到本地存储')
  }

  // 使用本地存储
  saveMessagesToLocal(serializableMessages)
}

/**
 * 保存到本地存储（内部函数）
 */
const saveMessagesToLocal = (serializableMessages) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableMessages))
    console.log(`💾 已保存 ${serializableMessages.length} 条消息到本地存储`)
  } catch (error) {
    console.error('保存消息到本地失败:', error)
    // 如果存储空间不足，尝试只保存最近的消息
    try {
      const recentMessages = serializableMessages.slice(-Math.floor(MAX_HISTORY_LENGTH / 2))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentMessages))
      console.log(`💾 存储空间不足，已保存最近 ${recentMessages.length} 条消息`)
    } catch (retryError) {
      console.error('重试保存也失败:', retryError)
    }
  }
}

/**
 * 加载对话历史（优先服务端，失败则降级到本地）
 * @returns {Promise<Array>} 消息数组
 */
export const loadMessages = async () => {
  // 优先尝试从服务端加载
  if (isServerStorageAvailable()) {
    const serverMessages = await loadMessagesFromServer()
    if (serverMessages !== null) {
      // 服务端加载成功，同步到本地作为备份
      if (serverMessages.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverMessages.map(msg => ({
            type: msg.type,
            text: msg.text,
            timestamp: msg.timestamp ? msg.timestamp.toISOString() : new Date().toISOString(),
            isError: msg.isError || false
          }))))
        } catch (error) {
          console.warn('同步服务端消息到本地失败:', error)
        }
      }
      return serverMessages
    }
    // 服务端加载失败，降级到本地存储
    console.warn('⚠️ 服务端加载失败，降级到本地存储')
  }

  // 使用本地存储
  return loadMessagesFromLocal()
}

/**
 * 从本地存储加载（内部函数）
 */
const loadMessagesFromLocal = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      console.log('📭 没有找到保存的对话历史')
      return []
    }
    
    const messages = JSON.parse(stored)
    
    // 恢复时间戳对象，确保 isError 属性正确
    const restoredMessages = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      isError: msg.isError === true // 明确设置为布尔值，避免 undefined
    }))
    
    console.log(`📖 已从本地加载 ${restoredMessages.length} 条历史消息`)
    return restoredMessages
  } catch (error) {
    console.error('加载消息失败:', error)
    return []
  }
}

/**
 * 清除所有对话历史（服务端和本地）
 */
export const clearMessages = async () => {
  let success = true

  // 清除服务端历史
  if (isServerStorageAvailable()) {
    const serverSuccess = await clearMessagesFromServer()
    if (!serverSuccess) {
      success = false
    }
  }

  // 清除本地历史
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('🗑️ 已清除本地对话历史')
  } catch (error) {
    console.error('清除本地消息失败:', error)
    success = false
  }

  return success
}

/**
 * 获取存储的消息数量
 * @returns {number} 消息数量
 */
export const getMessageCount = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return 0
    const messages = JSON.parse(stored)
    return messages.length
  } catch (error) {
    return 0
  }
}

/**
 * 检查是否有保存的对话历史
 * @returns {boolean}
 */
export const hasStoredMessages = () => {
  return getMessageCount() > 0
}

