/**
 * MCP (Model Context Protocol) 服务
 * 用于与 MCP 服务器通信，支持工具调用、资源访问等功能
 */

// 从环境变量获取 MCP 配置
const getMCPConfig = () => {
  return {
    mcpServerUrl: import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3001',
    mcpApiKey: import.meta.env.VITE_MCP_API_KEY || '',
    mcpTransport: import.meta.env.VITE_MCP_TRANSPORT || 'http', // 'http' 或 'websocket'
    enableTools: import.meta.env.VITE_MCP_ENABLE_TOOLS === 'true',
    enableResources: import.meta.env.VITE_MCP_ENABLE_RESOURCES === 'true'
  }
}

/**
 * MCP HTTP 请求
 */
const mcpRequest = async (endpoint, method = 'GET', body = null) => {
  const config = getMCPConfig()
  const url = `${config.mcpServerUrl}${endpoint}`
  
  const headers = {
    'Content-Type': 'application/json'
  }
  
  if (config.mcpApiKey) {
    headers['Authorization'] = `Bearer ${config.mcpApiKey}`
  }

  const options = {
    method,
    headers
  }

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new Error(error.error?.message || `MCP API error: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * 获取可用的工具列表
 */
export const getMCPTools = async () => {
  try {
    const config = getMCPConfig()
    if (!config.enableTools) {
      return []
    }

    // MCP 标准端点：/tools 或 /mcp/tools
    const tools = await mcpRequest('/tools', 'GET').catch(() => 
      mcpRequest('/mcp/tools', 'GET')
    )
    
    return tools.tools || tools || []
  } catch (error) {
    console.warn('获取 MCP 工具失败:', error)
    return []
  }
}

/**
 * 调用 MCP 工具
 */
export const callMCPTool = async (toolName, arguments_) => {
  try {
    const config = getMCPConfig()
    if (!config.enableTools) {
      throw new Error('MCP 工具功能未启用')
    }

    // MCP 标准端点：/tools/call 或 /mcp/tools/call
    const result = await mcpRequest('/tools/call', 'POST', {
      name: toolName,
      arguments: arguments_
    }).catch(() => 
      mcpRequest('/mcp/tools/call', 'POST', {
        name: toolName,
        arguments: arguments_
      })
    )

    return result
  } catch (error) {
    console.error('调用 MCP 工具失败:', error)
    throw error
  }
}

/**
 * 获取可用的资源列表
 */
export const getMCPResources = async () => {
  try {
    const config = getMCPConfig()
    if (!config.enableResources) {
      return []
    }

    // MCP 标准端点：/resources 或 /mcp/resources
    const resources = await mcpRequest('/resources', 'GET').catch(() =>
      mcpRequest('/mcp/resources', 'GET')
    )

    return resources.resources || resources || []
  } catch (error) {
    console.warn('获取 MCP 资源失败:', error)
    return []
  }
}

/**
 * 读取 MCP 资源
 */
export const readMCPResource = async (uri) => {
  try {
    const config = getMCPConfig()
    if (!config.enableResources) {
      throw new Error('MCP 资源功能未启用')
    }

    // MCP 标准端点：/resources/read 或 /mcp/resources/read
    const result = await mcpRequest('/resources/read', 'POST', {
      uri
    }).catch(() =>
      mcpRequest('/mcp/resources/read', 'POST', {
        uri
      })
    )

    return result
  } catch (error) {
    console.error('读取 MCP 资源失败:', error)
    throw error
  }
}

/**
 * 使用 MCP 进行对话（如果 MCP 服务器支持）
 */
export const chatWithMCP = async (messages) => {
  try {
    const config = getMCPConfig()
    
    // 如果 MCP 服务器支持聊天接口
    const result = await mcpRequest('/chat', 'POST', {
      messages: messages
    }).catch(() =>
      mcpRequest('/mcp/chat', 'POST', {
        messages: messages
      })
    )

    return result
  } catch (error) {
    console.error('MCP 聊天失败:', error)
    throw error
  }
}

/**
 * 检查 MCP 服务器连接
 */
export const checkMCPConnection = async () => {
  try {
    const config = getMCPConfig()
    
    // 尝试访问健康检查端点
    await mcpRequest('/health', 'GET').catch(() =>
      mcpRequest('/mcp/health', 'GET')
    )
    
    return { connected: true }
  } catch (error) {
    return { 
      connected: false, 
      error: error.message 
    }
  }
}

/**
 * 智能调用 MCP：自动检测并调用合适的工具
 */
export const smartMCPCall = async (userMessage, availableTools = null) => {
  try {
    // 如果没有提供工具列表，先获取
    if (!availableTools) {
      availableTools = await getMCPTools()
    }

    // 简单的工具匹配逻辑（可以根据需要改进）
    // 这里可以根据用户消息内容，智能选择要调用的工具
    const messageLower = userMessage.toLowerCase()
    
    // 示例：如果消息包含特定关键词，调用相应工具
    for (const tool of availableTools) {
      if (tool.name && messageLower.includes(tool.name.toLowerCase())) {
        // 提取参数（这里需要根据实际需求实现更复杂的参数提取）
        const args = extractToolArguments(userMessage, tool)
        return await callMCPTool(tool.name, args)
      }
    }

    // 如果没有匹配的工具，返回 null
    return null
  } catch (error) {
    console.error('智能 MCP 调用失败:', error)
    return null
  }
}

/**
 * 从用户消息中提取工具参数（简单实现）
 */
const extractToolArguments = (userMessage, tool) => {
  // 这是一个简单的实现，实际使用时需要更复杂的 NLP 或规则匹配
  const args = {}
  
  // 如果工具有参数定义，尝试提取
  if (tool.inputSchema && tool.inputSchema.properties) {
    for (const [key, schema] of Object.entries(tool.inputSchema.properties)) {
      // 简单的关键词匹配
      if (userMessage.includes(key)) {
        // 这里可以实现更复杂的参数提取逻辑
        args[key] = extractValue(userMessage, key)
      }
    }
  }

  return args
}

/**
 * 从消息中提取值（简单实现）
 */
const extractValue = (message, key) => {
  // 简单的正则匹配，实际使用时需要更复杂的实现
  const regex = new RegExp(`${key}[：:](\\S+)`, 'i')
  const match = message.match(regex)
  return match ? match[1] : null
}

/**
 * 获取 MCP 服务器信息
 */
export const getMCPInfo = async () => {
  try {
    const info = await mcpRequest('/info', 'GET').catch(() =>
      mcpRequest('/mcp/info', 'GET')
    )
    return info
  } catch (error) {
    console.warn('获取 MCP 信息失败:', error)
    return null
  }
}

