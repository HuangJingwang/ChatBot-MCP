/**
 * MCP 工具服务 - 将 MCP 服务作为工具集成
 * 支持 JSON-RPC 2.0 协议
 */

import { getUserInfo, getCurrentOrganize, getCookieId } from './authService.js'

// 从环境变量获取 MCP 配置
const getMCPConfig = () => {
  return {
    // 直接使用配置的 URL，不通过代理
    mcpServerUrl: import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3001',
    mcpCookieId: import.meta.env.VITE_MCP_COOKIE_ID || '',
    enableMCPTools: import.meta.env.VITE_ENABLE_MCP_TOOLS === 'true'
  }
}

// JSON-RPC 2.0 请求 ID 计数器
let requestIdCounter = 1

// 工具列表缓存
let toolsCache = null
let toolsCacheTime = null
const TOOLS_CACHE_DURATION = 5 * 60 * 1000 // 缓存 5 分钟

/**
 * 发送 JSON-RPC 2.0 请求
 */
const sendMCPRequest = async (method, params = {}) => {
  const config = getMCPConfig()
  
  if (!config.enableMCPTools) {
    throw new Error('MCP 工具功能未启用。请在 .env 文件中设置 VITE_ENABLE_MCP_TOOLS=true')
  }

  if (!config.mcpCookieId) {
    throw new Error('MCP Cookie ID 未配置。请在 .env 文件中设置 VITE_MCP_COOKIE_ID')
  }

  const request = {
    jsonrpc: '2.0',
    id: requestIdCounter++,
    method: method,
    params: params
  }

  console.log('📤 发送 MCP 请求:', {
    url: config.mcpServerUrl,
    method: method,
    request: request
  })

  const response = await fetch(config.mcpServerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'cookieId': config.mcpCookieId
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: { 
        code: -32603,
        message: `HTTP error: ${response.statusText}` 
      } 
    }))
    throw new Error(error.error?.message || `MCP 请求失败: ${response.statusText}`)
  }

  const data = await response.json()

  // 检查 JSON-RPC 错误响应
  if (data.error) {
    throw new Error(`MCP 错误 [${data.error.code}]: ${data.error.message}`)
  }

  return data.result
}

/**
 * 初始化 MCP 连接
 */
export const initializeMCP = async () => {
  try {
    const result = await sendMCPRequest('initialize', {})
    return result
  } catch (error) {
    console.error('MCP 初始化失败:', error)
    throw error
  }
}

/**
 * 获取 MCP 工具列表（带缓存）
 */
export const getMCPToolsList = async (forceRefresh = false) => {
  try {
    // 检查缓存
    const now = Date.now()
    if (!forceRefresh && toolsCache && toolsCacheTime && (now - toolsCacheTime) < TOOLS_CACHE_DURATION) {
      console.log('📦 使用缓存的工具列表')
      return toolsCache
    }

    console.log('🔄 从服务器获取工具列表...')
    const result = await sendMCPRequest('tools/list', {})
    
    // 返回工具列表，每个工具包含 name, description, inputSchema 等
    const tools = result.tools || []
    
    // 更新缓存
    toolsCache = tools
    toolsCacheTime = now
    console.log(`✅ 工具列表已缓存，共 ${tools.length} 个工具`)
    
    return tools
  } catch (error) {
    console.error('获取 MCP 工具列表失败:', error)
    // 如果缓存存在，返回缓存（即使过期）
    if (toolsCache) {
      console.warn('⚠️ 使用过期的工具列表缓存')
      return toolsCache
    }
    throw error
  }
}

/**
 * 根据工具 schema 动态注入用户信息
 * 这个方法会根据服务端返回的 schema 结构，自动在需要的位置注入用户信息
 */
const enrichArgumentsWithUserInfo = async (toolName, arguments_) => {
  try {
    // 获取工具 schema
    const toolInfo = await getToolInfo(toolName)
    if (!toolInfo || !toolInfo.inputSchema) {
      // 如果没有 schema，直接返回原参数
      return arguments_
    }
    
    const schema = toolInfo.inputSchema
    const userInfo = getUserInfo()
    const currentOrganize = getCurrentOrganize()
    
    if (!userInfo) {
      // 如果没有用户信息，直接返回原参数
      return arguments_
    }
    
    // 构建用户信息对象（供注入使用）
    const userContext = {
      userId: userInfo.userId || userInfo.id || '',
      moderator: currentOrganize ? {
        id: currentOrganize.userId || userInfo.userId || userInfo.id || '',
        name: currentOrganize.userName || userInfo.name || userInfo.userName || '',
        isUser: true,
        user: true,
        userId: currentOrganize.userId || userInfo.userId || userInfo.id || '',
        userName: currentOrganize.userName || userInfo.name || userInfo.userName || '',
        orgId: currentOrganize.orgId || userInfo.orgId || '',
        orgName: currentOrganize.orgName || userInfo.orgName || '',
        deptId: currentOrganize.deptId || userInfo.deptId || '',
        deptName: currentOrganize.deptName || userInfo.deptName || '',
        companyId: currentOrganize.companyId || userInfo.companyId || ''
      } : {
        id: userInfo.userId || userInfo.id || '',
        name: userInfo.name || userInfo.userName || '',
        isUser: true,
        user: true,
        userId: userInfo.userId || userInfo.id || '',
        userName: userInfo.name || userInfo.userName || '',
        orgId: userInfo.orgId || '',
        orgName: userInfo.orgName || '',
        deptId: userInfo.deptId || '',
        deptName: userInfo.deptName || '',
        companyId: userInfo.companyId || ''
      }
    }
    
    // 深度克隆参数对象
    const enrichedArgs = JSON.parse(JSON.stringify(arguments_))
    
    // 根据 schema 检查并注入用户信息
    // 如果 schema 中定义了 userId 字段但参数中没有，则注入
    if (schema.properties?.userId && !enrichedArgs.userId) {
      enrichedArgs.userId = userContext.userId
    }
    
    // 如果 schema 中定义了 command.moderator 路径，检查并注入
    if (schema.properties?.command?.properties?.moderator) {
      if (!enrichedArgs.command) {
        enrichedArgs.command = {}
      }
      if (!enrichedArgs.command.moderator) {
        enrichedArgs.command.moderator = userContext.moderator
      } else {
        // 如果已有 moderator，补充缺失字段
        enrichedArgs.command.moderator = {
          ...userContext.moderator,
          ...enrichedArgs.command.moderator
        }
      }
    }
    
    return enrichedArgs
  } catch (error) {
    console.warn('注入用户信息失败，使用原参数:', error)
    return arguments_
  }
}

/**
 * 调用 MCP 工具
 */
export const callMCPTool = async (toolName, arguments_) => {
  try {
    console.log('🔧 调用 MCP 工具:', {
      toolName,
      originalArguments: arguments_,
      argumentsType: typeof arguments_,
      argumentsKeys: arguments_ ? Object.keys(arguments_) : []
    })
    
    // 根据服务端 schema 动态注入用户信息
    const enrichedArguments = await enrichArgumentsWithUserInfo(toolName, arguments_)
    
    console.log('🔧 注入用户信息后的参数:', enrichedArguments)
    
    const result = await sendMCPRequest('tools/call', {
      name: toolName,
      arguments: enrichedArguments
    })

    console.log('✅ MCP 工具调用成功:', result)
    return result
  } catch (error) {
    console.error(`❌ 调用 MCP 工具 ${toolName} 失败:`, error)
    throw error
  }
}

/**
 * 获取工具信息（包括参数 Schema）
 */
export const getToolInfo = async (toolName) => {
  try {
    const tools = await getMCPToolsList()
    return tools.find(tool => tool.name === toolName)
  } catch (error) {
    console.error('获取工具信息失败:', error)
    return null
  }
}

/**
 * 验证工具参数是否符合 Schema
 */
export const validateToolArguments = (arguments_, schema) => {
  if (!schema || !schema.properties) {
    return { valid: true, errors: [] }
  }

  const errors = []
  const required = schema.required || []

  // 检查必需字段
  for (const field of required) {
    if (!(field in arguments_) || arguments_[field] === undefined || arguments_[field] === null) {
      errors.push(`缺少必需字段: ${field}`)
    }
  }

  // 检查字段类型（简单验证）
  for (const [field, value] of Object.entries(arguments_)) {
    if (schema.properties[field]) {
      const fieldSchema = schema.properties[field]
      const expectedType = fieldSchema.type

      if (expectedType && typeof value !== expectedType) {
        // 特殊处理：如果期望是 object，实际值可以是对象
        if (expectedType === 'object' && typeof value === 'object' && !Array.isArray(value)) {
          continue
        }
        // 特殊处理：如果期望是 array，实际值可以是数组
        if (expectedType === 'array' && Array.isArray(value)) {
          continue
        }
        errors.push(`字段 ${field} 类型错误: 期望 ${expectedType}, 实际 ${typeof value}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 格式化工具列表为 AI 可理解的格式
 */
export const formatToolsForAI = async () => {
  try {
    const tools = await getMCPToolsList()
    
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description || '',
      parameters: tool.inputSchema || {}
    }))
  } catch (error) {
    console.error('格式化工具列表失败:', error)
    return []
  }
}

/**
 * 智能匹配用户消息和工具
 */
export const matchToolByUserMessage = async (userMessage) => {
  try {
    const tools = await getMCPToolsList()
    const messageLower = userMessage.toLowerCase()
    
    // 工具匹配规则（可以根据实际需求扩展）
    const toolKeywords = {
      'meeting_create': ['创建会议', '新建会议', '建立会议', '安排会议', '预约会议', 'create meeting', 'new meeting', 'schedule meeting'],
      'meeting_get_detail': ['会议详情', '会议信息', '查看会议', '会议详情', 'meeting detail', 'meeting info'],
      'meeting_get_completed_kr_topics': ['已完成', '完成的kr', 'completed kr', 'kr topic']
    }

    // 匹配工具
    for (const tool of tools) {
      const keywords = toolKeywords[tool.name] || []
      
      // 检查消息中是否包含工具相关的关键词
      const matched = keywords.some(keyword => messageLower.includes(keyword.toLowerCase()))
      
      if (matched) {
        console.log(`🎯 智能匹配到工具: ${tool.name}`)
        return {
          tool: tool,
          matched: true,
          confidence: 'high'
        }
      }
      
      // 也检查工具名称和描述
      if (messageLower.includes(tool.name.toLowerCase()) || 
          (tool.description && messageLower.includes(tool.description.toLowerCase().split(' ')[0]))) {
        console.log(`🎯 通过名称/描述匹配到工具: ${tool.name}`)
        return {
          tool: tool,
          matched: true,
          confidence: 'medium'
        }
      }
    }

    return { matched: false }
  } catch (error) {
    console.error('智能工具匹配失败:', error)
    return { matched: false }
  }
}

/**
 * 智能解析用户意图并调用相应工具
 */
export const smartCallTool = async (userMessage, availableTools = null) => {
  try {
    // 如果没有提供工具列表，先获取
    if (!availableTools) {
      availableTools = await getMCPToolsList()
    }

    // 简单的关键词匹配（可以根据需要改进为更智能的 NLP 匹配）
    const messageLower = userMessage.toLowerCase()

    // 遍历工具，查找匹配的工具
    for (const tool of availableTools) {
      const toolNameLower = tool.name.toLowerCase()
      const descriptionLower = (tool.description || '').toLowerCase()

      // 如果消息中包含工具名称或描述关键词
      if (messageLower.includes(toolNameLower) || 
          (descriptionLower && messageLower.includes(descriptionLower.split(' ')[0]))) {
        
        // 尝试提取参数（这里需要根据实际需求实现更复杂的参数提取）
        const args = extractToolArguments(userMessage, tool)
        
        // 验证参数
        const validation = validateToolArguments(args, tool.inputSchema)
        if (!validation.valid) {
          console.warn(`工具 ${tool.name} 参数验证失败:`, validation.errors)
          // 可以返回错误或尝试修复参数
          continue
        }

        // 调用工具
        return await callMCPTool(tool.name, args)
      }
    }

    return null
  } catch (error) {
    console.error('智能工具调用失败:', error)
    return null
  }
}

/**
 * 从用户消息中提取工具参数
 * 这是一个简单实现，实际使用时需要更复杂的 NLP 或规则匹配
 */
const extractToolArguments = (userMessage, tool) => {
  const args = {}
  
  if (!tool.inputSchema || !tool.inputSchema.properties) {
    return args
  }

  // 简单的参数提取逻辑
  for (const [key, schema] of Object.entries(tool.inputSchema.properties)) {
    // 尝试从消息中提取值
    const value = extractValueFromMessage(userMessage, key, schema)
    if (value !== null && value !== undefined) {
      args[key] = value
    }
  }

  return args
}

/**
 * 从消息中提取值（简单实现）
 */
const extractValueFromMessage = (message, key, schema) => {
  // 简单的正则匹配
  const patterns = [
    new RegExp(`${key}[：:](\\S+)`, 'i'),
    new RegExp(`${key}\\s*=\\s*(\\S+)`, 'i'),
    new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, 'i')
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      let value = match[1]
      
      // 根据类型转换
      if (schema.type === 'number' || schema.type === 'integer') {
        value = Number(value)
        if (isNaN(value)) return null
      } else if (schema.type === 'boolean') {
        value = value.toLowerCase() === 'true' || value === '1'
      } else if (schema.type === 'object') {
        // 尝试解析 JSON
        try {
          value = JSON.parse(value)
        } catch {
          // 如果不是 JSON，返回原始值
        }
      }

      return value
    }
  }

  return null
}

/**
 * 检查 MCP 服务连接
 */
export const checkMCPConnection = async () => {
  try {
    await initializeMCP()
    return { connected: true }
  } catch (error) {
    return {
      connected: false,
      error: error.message
    }
  }
}

