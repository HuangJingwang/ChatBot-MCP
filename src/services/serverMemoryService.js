/**
 * 服务端对话记忆服务 - 将对话历史保存到服务端
 * 支持跨页面/跨设备同步
 */

// 从环境变量获取配置
const getServerConfig = () => {
  return {
    serverUrl: import.meta.env.VITE_MEMORY_SERVER_URL || '',
    cookieId: import.meta.env.VITE_MCP_COOKIE_ID || '',
    enableServerStorage: import.meta.env.VITE_ENABLE_SERVER_MEMORY === 'true'
  }
}

/**
 * 发送请求到服务端
 */
const sendServerRequest = async (endpoint, method = 'GET', body = null) => {
  const config = getServerConfig()
  
  if (!config.enableServerStorage) {
    throw new Error('服务端存储未启用')
  }
  
  if (!config.serverUrl) {
    throw new Error('服务端存储 URL 未配置')
  }
  
  if (!config.cookieId) {
    throw new Error('Cookie ID 未配置，无法识别用户身份')
  }

  const url = `${config.serverUrl}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    'cookieId': config.cookieId
  }

  const options = {
    method,
    headers
  }

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body)
  }

  console.log(`📡 发送服务端存储请求: ${method} ${url}`)

  const response = await fetch(url, options)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: { message: `HTTP error: ${response.statusText}` } 
    }))
    throw new Error(error.error?.message || `服务端存储请求失败: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * 保存对话历史到服务端
 * @param {Array} messages - 消息数组
 */
export const saveMessagesToServer = async (messages) => {
  try {
    const config = getServerConfig()
    
    if (!config.enableServerStorage) {
      console.log('⚠️ 服务端存储未启用，跳过保存')
      return false
    }

    // 转换消息格式，确保可以序列化
    const serializableMessages = messages.map(msg => ({
      type: msg.type,
      text: msg.text,
      timestamp: msg.timestamp ? msg.timestamp.toISOString() : new Date().toISOString(),
      isError: msg.isError || false
    }))

    await sendServerRequest('/api/messages', 'POST', {
      messages: serializableMessages
    })

    console.log(`💾 已保存 ${serializableMessages.length} 条消息到服务端`)
    return true
  } catch (error) {
    console.error('保存消息到服务端失败:', error)
    return false
  }
}

/**
 * 从服务端加载对话历史
 * @returns {Array} 消息数组
 */
export const loadMessagesFromServer = async () => {
  try {
    const config = getServerConfig()
    
    if (!config.enableServerStorage) {
      console.log('⚠️ 服务端存储未启用，跳过加载')
      return null
    }

    const response = await sendServerRequest('/api/messages', 'GET')
    
    if (!response.messages || !Array.isArray(response.messages)) {
      console.log('📭 服务端没有保存的对话历史')
      return []
    }

    // 恢复时间戳对象
    const restoredMessages = response.messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      isError: msg.isError === true
    }))

    console.log(`📖 已从服务端加载 ${restoredMessages.length} 条历史消息`)
    return restoredMessages
  } catch (error) {
    console.error('从服务端加载消息失败:', error)
    return null // 返回 null 表示失败，可以降级到本地存储
  }
}

/**
 * 清除服务端的对话历史
 */
export const clearMessagesFromServer = async () => {
  try {
    const config = getServerConfig()
    
    if (!config.enableServerStorage) {
      console.log('⚠️ 服务端存储未启用，跳过清除')
      return false
    }

    await sendServerRequest('/api/messages', 'DELETE')
    console.log('🗑️ 已清除服务端的对话历史')
    return true
  } catch (error) {
    console.error('清除服务端消息失败:', error)
    return false
  }
}

/**
 * 检查服务端存储是否可用
 */
export const isServerStorageAvailable = () => {
  const config = getServerConfig()
  return config.enableServerStorage && !!config.serverUrl && !!config.cookieId
}

