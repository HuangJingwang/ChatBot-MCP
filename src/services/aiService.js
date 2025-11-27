/**
 * AI 服务 - 支持多种 AI 模型提供商
 */
import { chatWithMCP, smartMCPCall, getMCPTools } from './mcpService.js'
import { getMCPToolsList, callMCPTool, formatToolsForAI, checkMCPConnection } from './mcpToolService.js'
import { getUserInfo, getCurrentOrganize } from './authService.js'

// 支持的 AI 提供商类型
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  CLAUDE: 'claude',
  LOCAL: 'local',
  CUSTOM: 'custom',
  MCP: 'mcp'
}

// 从环境变量获取配置
const getConfig = () => {
  return {
    provider: import.meta.env.VITE_AI_PROVIDER || 'openai',
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    openaiBaseUrl: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openaiModel: import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo',
    claudeApiKey: import.meta.env.VITE_CLAUDE_API_KEY || '',
    claudeBaseUrl: import.meta.env.VITE_CLAUDE_BASE_URL || 'https://api.anthropic.com/v1',
    claudeModel: import.meta.env.VITE_CLAUDE_MODEL || 'claude-3-haiku-20240307',
    customApiUrl: import.meta.env.VITE_CUSTOM_API_URL || '',
    customApiKey: import.meta.env.VITE_CUSTOM_API_KEY || '',
    mcpServerUrl: import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3001',
    mcpApiKey: import.meta.env.VITE_MCP_API_KEY || '',
    mcpCookieId: import.meta.env.VITE_MCP_COOKIE_ID || '',
    mcpEnableTools: import.meta.env.VITE_MCP_ENABLE_TOOLS === 'true',
    mcpEnableResources: import.meta.env.VITE_MCP_ENABLE_RESOURCES === 'true',
    enableMCPTools: import.meta.env.VITE_ENABLE_MCP_TOOLS === 'true'
  }
}

// 工具列表缓存（在模块级别）
let cachedTools = null
let cachedToolsTime = null
const TOOLS_CACHE_DURATION = 5 * 60 * 1000 // 缓存 5 分钟

/**
 * 获取可用的工具列表（用于 AI 工具调用，带缓存）
 */
const getAvailableTools = async (config, forceRefresh = false) => {
  try {
    console.warn('MCP start - 即将检查 MCP 配置')
    // 检查是否启用了 MCP 工具（使用正确的环境变量名）
    const enableMCPTools = import.meta.env.VITE_ENABLE_MCP_TOOLS === 'true'
    
    console.log('🔧 MCP 工具配置检查:', {
      enableMCPTools,
      envValue: import.meta.env.VITE_ENABLE_MCP_TOOLS,
      mcpServerUrl: config.mcpServerUrl,
      hasCookieId: !!config.mcpCookieId
    })
    
    if (!enableMCPTools) {
      console.log('⚠️ MCP 工具功能未启用，请在 .env 文件中设置 VITE_ENABLE_MCP_TOOLS=true')
      return []
    }
    
    if (!config.mcpServerUrl) {
      console.warn('⚠️ MCP 服务器 URL 未配置')
      return []
    }
    
    if (!config.mcpCookieId) {
      console.warn('⚠️ MCP Cookie ID 未配置，工具调用可能失败')
    }
    
    // 检查缓存
    const now = Date.now()
    if (!forceRefresh && cachedTools && cachedToolsTime && (now - cachedToolsTime) < TOOLS_CACHE_DURATION) {
      console.log('📦 使用缓存的工具列表（AI 格式）')
      return cachedTools
    }

    console.log('📡 正在获取 MCP 工具列表...')
    const mcpTools = await formatToolsForAI(forceRefresh)
    console.log('✅ 获取到的 MCP 工具数量:', mcpTools.length)
    
    if (mcpTools.length === 0) {
      // 如果缓存存在，使用缓存
      if (cachedTools && cachedTools.length > 0) {
        console.warn('⚠️ 工具列表获取失败，使用缓存')
        return cachedTools
      }
      console.warn('⚠️ MCP 工具列表为空，请检查：')
      console.warn('  1. MCP 服务器是否正常运行')
      console.warn('  2. VITE_MCP_SERVER_URL 配置是否正确')
      console.warn('  3. VITE_MCP_COOKIE_ID 配置是否正确')
      console.warn('  4. MCP 服务器是否实现了 tools/list 方法')
      return []
    }
    
    // 直接使用 MCP 服务器返回的工具描述（不做任何修改）
    const formattedTools = mcpTools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || `调用 ${tool.name} 工具`,
        parameters: tool.parameters
      }
    }))
    
    // 更新缓存
    cachedTools = formattedTools
    cachedToolsTime = now
    console.log('✅ 格式化后的工具列表已缓存:', formattedTools.map(t => t.function.name))
    return formattedTools
  } catch (error) {
    console.error('❌ 获取工具列表失败:', error)
    console.error('错误详情:', error.message)
    return []
  }
}

/**
 * 处理工具调用结果
 */
const handleToolCalls = async (toolCalls, config) => {
  const results = []
  
  for (const toolCall of toolCalls) {
    try {
      const toolName = toolCall.function.name
      const args = JSON.parse(toolCall.function.arguments || '{}')
      
      console.log('🔧 AI 传递的工具参数:', {
        toolName,
        rawArguments: toolCall.function.arguments,
        parsedArguments: args,
        hasCommand: 'command' in args
      })
      
      // 调用 MCP 工具
      const result = await callMCPTool(toolName, args)
      
      results.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolName,
        content: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      })
    } catch (error) {
      console.error('工具调用失败:', error)
      results.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolCall.function.name,
        content: `错误: ${error.message}`
      })
    }
  }
  
  return results
}

/**
 * OpenAI API 调用（支持工具调用）
 */
const callOpenAI = async (messages, config) => {
  // 获取可用工具
  const tools = await getAvailableTools(config)
  
  const requestBody = {
    model: config.openaiModel,
    messages: messages,
    temperature: 0.7,
    stream: false
  }
  
  // 如果有工具，添加到请求中
  if (tools.length > 0) {
    requestBody.tools = tools
    requestBody.tool_choice = 'auto'
  }

  const response = await fetch(`${config.openaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  const message = data.choices[0].message

  // 如果 AI 想要调用工具
  if (message.tool_calls && message.tool_calls.length > 0) {
    console.log('🔧 AI 请求调用工具:', message.tool_calls.map(tc => tc.function.name))
    
    // 执行工具调用
    const toolResults = await handleToolCalls(message.tool_calls, config)
    console.log('✅ 工具调用完成，结果数量:', toolResults.length)
    
    // 将工具调用和结果添加到消息历史
    const newMessages = [
      ...messages,
      message,
      ...toolResults
    ]
    
    // 再次调用 AI，让它处理工具调用结果
    console.log('🔄 将工具结果返回给 AI 处理...')
    return await callOpenAI(newMessages, config)
  }

  if (tools.length > 0 && !message.tool_calls) {
    console.log('⚠️ AI 没有调用工具，可能的原因：')
    console.log('  1. AI 认为不需要调用工具')
    console.log('  2. 工具描述不够清晰')
    console.log('  3. 用户消息没有触发工具调用条件')
  }

  return message.content
}

/**
 * Claude API 调用
 */
const callClaude = async (messages, config) => {
  // 转换消息格式为 Claude 格式
  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))

  const response = await fetch(`${config.claudeBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.claudeApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.claudeModel,
      max_tokens: 1024,
      system: systemMessage?.content || 'You are a helpful assistant.',
      messages: conversationMessages
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new Error(error.error?.message || `Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.content[0].text
}

/**
 * 自定义 API 调用（兼容 OpenAI 格式）
 */
const callCustom = async (messages, config) => {
  // 如果 customApiUrl 是完整路径，直接使用；否则拼接
  const apiUrl = config.customApiUrl || `${config.openaiBaseUrl}/chat/completions`
  const apiKey = config.customApiKey || config.openaiApiKey

  // 获取最后一条用户消息
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()
  
  // 智能匹配工具：如果用户消息明确需要某个工具，主动提示 AI
  if (lastUserMessage && config.enableMCPTools) {
    const { matchToolByUserMessage } = await import('./mcpToolService.js')
    const matchResult = await matchToolByUserMessage(lastUserMessage.content)
    
    if (matchResult.matched && matchResult.tool) {
      console.log(`🎯 检测到用户可能需要使用工具: ${matchResult.tool.name}`)
      // 在系统消息中提示 AI 使用该工具
      const systemMessage = messages.find(m => m.role === 'system')
      if (systemMessage) {
        systemMessage.content += `\n\n注意：用户的消息可能需要使用工具 "${matchResult.tool.name}"。如果用户明确要求创建会议、查看会议详情等操作，请使用相应的工具。`
      } else {
        messages.unshift({
          role: 'system',
          content: `你是一个智能助手。用户的消息可能需要使用工具 "${matchResult.tool.name}"。如果用户明确要求创建会议、查看会议详情等操作，请使用相应的工具。`
        })
      }
    }
  }

  // 获取可用工具
  const tools = await getAvailableTools(config)

  console.log('调用自定义 API:', apiUrl)

  const requestBody = {
    model: config.openaiModel || 'gpt-3.5-turbo',
    messages: messages,
    temperature: 0.7
  }

  if (tools.length > 0) {
    console.log('🔧 自定义模型将工具添加到请求中，工具数量:', tools.length)
    requestBody.tools = tools
    requestBody.tool_choice = 'auto'
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new Error(error.error?.message || `API error: ${response.statusText}`)
  }

  const data = await response.json()
  const message = data.choices[0].message

  if (message.tool_calls && message.tool_calls.length > 0) {
    console.log('🔧 自定义模型请求调用工具:', message.tool_calls.map(tc => tc.function.name))
    const toolResults = await handleToolCalls(message.tool_calls, config)
    console.log('✅ 工具调用完成，结果数量:', toolResults.length)

    const newMessages = [
      ...messages,
      message,
      ...toolResults
    ]

    console.log('🔄 将工具结果返回给自定义模型处理...')
    return await callCustom(newMessages, config)
  }

  if (tools.length > 0 && !message.tool_calls) {
    console.log('⚠️ 自定义模型未调用任何工具，可能原因：信息不足或描述不明确')
  }

  return message.content
}

/**
 * 本地模型调用（用于测试或本地部署的模型）
 */
const callLocal = async (messages) => {
  // 这里可以接入本地模型，比如通过本地 API 服务器
  // 示例：调用本地运行的模型服务
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama2',
      messages: messages,
      stream: false
    })
  })

  if (!response.ok) {
    throw new Error(`Local API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.message.content
}

/**
 * 将聊天历史转换为 API 消息格式
 * @param {Array} chatHistory - 聊天历史数组
 * @param {number} maxHistoryLength - 最大历史长度（默认保留最近30条消息，避免token超限）
 */
const formatMessages = (chatHistory, maxHistoryLength = 30) => {
  const messages = []
  
  // 获取用户信息
  const userInfo = getUserInfo()
  const currentOrganize = getCurrentOrganize()
  
  // 构建系统提示，包含用户上下文信息
  let systemContent = 'You are a helpful AI assistant. Respond in a clear and concise manner.'
  
  if (userInfo) {
    const userContext = []
    
    // 添加用户基本信息
    if (userInfo.name || userInfo.userName) {
      userContext.push(`当前用户姓名：${userInfo.name || userInfo.userName}`)
    }
    if (userInfo.mobile) {
      userContext.push(`用户手机号：${userInfo.mobile}`)
    }
    
    // 添加组织信息
    if (currentOrganize) {
      if (currentOrganize.orgName) {
        userContext.push(`所属组织：${currentOrganize.orgName}`)
      }
      if (currentOrganize.deptName) {
        userContext.push(`所属部门：${currentOrganize.deptName}`)
      }
      if (currentOrganize.companyId) {
        userContext.push(`公司ID：${currentOrganize.companyId}`)
      }
    } else if (userInfo.companyName) {
      userContext.push(`所属公司：${userInfo.companyName}`)
    }
    
    if (userInfo.deptName) {
      userContext.push(`部门：${userInfo.deptName}`)
    }
    
    // 添加角色和权限信息
    if (userInfo.roles && userInfo.roles.length > 0) {
      userContext.push(`用户角色：${userInfo.roles.join(', ')}`)
    }
    
    if (userContext.length > 0) {
      systemContent += `\n\n用户上下文信息：\n${userContext.join('\n')}\n\n请记住这些信息，在对话中可以根据需要使用这些信息来提供更个性化的服务。`
      
      // 添加工具调用时的用户信息格式说明
      if (currentOrganize) {
        systemContent += `\n\n当调用工具时，如果需要提供用户信息（如 moderator 对象），请使用以下格式：\n` +
          `{\n` +
          `  "id": "${currentOrganize.userId || userInfo.userId || userInfo.id}",\n` +
          `  "name": "${currentOrganize.userName || userInfo.name || userInfo.userName}",\n` +
          `  "isUser": true,\n` +
          `  "user": true,\n` +
          `  "userId": "${currentOrganize.userId || userInfo.userId || userInfo.id}",\n` +
          `  "userName": "${currentOrganize.userName || userInfo.name || userInfo.userName}",\n` +
          `  "orgId": "${currentOrganize.orgId || userInfo.orgId || ''}",\n` +
          `  "orgName": "${currentOrganize.orgName || userInfo.orgName || ''}",\n` +
          `  "deptId": "${currentOrganize.deptId || userInfo.deptId || ''}",\n` +
          `  "deptName": "${currentOrganize.deptName || userInfo.deptName || ''}",\n` +
          `  "companyId": "${currentOrganize.companyId || userInfo.companyId || ''}"\n` +
          `}\n\n` +
          `请严格按照工具描述（schema）中定义的参数结构来构造参数。如果工具需要 userId 字段，请使用：${userInfo.userId || userInfo.id || ''}`
      }
    }
  }
  
  // 添加系统提示
  messages.push({
    role: 'system',
    content: systemContent
  })

  // 限制历史长度：只保留最近的消息（保留最近的对话上下文）
  // 这样可以避免token超限，同时保持对话的连贯性
  const recentHistory = chatHistory.length > maxHistoryLength 
    ? chatHistory.slice(-maxHistoryLength)
    : chatHistory

  // 转换聊天历史
  recentHistory.forEach(msg => {
    messages.push({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    })
  })

  // 如果历史被截断，记录日志
  if (chatHistory.length > maxHistoryLength) {
    console.log(`📝 历史消息已截断：保留最近 ${maxHistoryLength} 条消息（总共 ${chatHistory.length} 条）`)
  }

  return messages
}

/**
 * MCP 调用（支持工具调用）
 */
const callMCP = async (messages, config) => {
  try {
    // 获取最后一条用户消息
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    
    if (!lastUserMessage) {
      throw new Error('没有用户消息')
    }

    // 如果启用了工具，尝试智能调用
    if (config.mcpEnableTools) {
      const tools = await getMCPTools()
      const toolResult = await smartMCPCall(lastUserMessage.content, tools)
      
      if (toolResult) {
        // 如果工具调用成功，返回结果
        return typeof toolResult === 'string' 
          ? toolResult 
          : JSON.stringify(toolResult, null, 2)
      }
    }

    // 否则使用 MCP 聊天接口
    const result = await chatWithMCP(messages)
    
    // 处理不同的响应格式
    if (result.message) {
      return result.message
    } else if (result.content) {
      return result.content
    } else if (result.text) {
      return result.text
    } else if (typeof result === 'string') {
      return result
    } else {
      return JSON.stringify(result, null, 2)
    }
  } catch (error) {
    console.error('MCP 调用失败:', error)
    throw error
  }
}

/**
 * 主函数：调用 AI 模型
 */
export const callAI = async (chatHistory) => {
  const config = getConfig()
  const messages = formatMessages(chatHistory)

  try {
    // 检查 API Key
    if (config.provider === AI_PROVIDERS.OPENAI && !config.openaiApiKey) {
      throw new Error('OpenAI API Key 未配置。请在 .env 文件中设置 VITE_OPENAI_API_KEY')
    }

    if (config.provider === AI_PROVIDERS.CLAUDE && !config.claudeApiKey) {
      throw new Error('Claude API Key 未配置。请在 .env 文件中设置 VITE_CLAUDE_API_KEY')
    }

    if (config.provider === AI_PROVIDERS.MCP && !config.mcpServerUrl) {
      throw new Error('MCP 服务器 URL 未配置。请在 .env 文件中设置 VITE_MCP_SERVER_URL')
    }

    // 根据配置的提供商调用相应的 API
    let response
    switch (config.provider) {
      case AI_PROVIDERS.OPENAI:
        response = await callOpenAI(messages, config)
        break
      case AI_PROVIDERS.CLAUDE:
        response = await callClaude(messages, config)
        break
      case AI_PROVIDERS.CUSTOM:
        response = await callCustom(messages, config)
        break
      case AI_PROVIDERS.LOCAL:
        response = await callLocal(messages)
        break
      case AI_PROVIDERS.MCP:
        response = await callMCP(messages, config)
        break
      default:
        throw new Error(`不支持的 AI 提供商: ${config.provider}`)
    }

    return response
  } catch (error) {
    console.error('AI API 调用错误:', error)
    throw error
  }
}

/**
 * 检查配置是否有效
 */
export const checkConfig = () => {
  const config = getConfig()
  const issues = []

  if (!config.provider) {
    issues.push('未配置 AI 提供商')
  }

  if (config.provider === AI_PROVIDERS.OPENAI && !config.openaiApiKey) {
    issues.push('未配置 OpenAI API Key')
  }

  if (config.provider === AI_PROVIDERS.CLAUDE && !config.claudeApiKey) {
    issues.push('未配置 Claude API Key')
  }

  if (config.provider === AI_PROVIDERS.CUSTOM) {
    if (!config.customApiUrl) {
      issues.push('未配置自定义 API URL')
    }
    // 自定义 API 的 API Key 是可选的（有些 API 不需要）
    // 如果需要 API Key，可以在这里添加检查
  }

  if (config.provider === AI_PROVIDERS.MCP && !config.mcpServerUrl) {
    issues.push('未配置 MCP 服务器 URL')
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

