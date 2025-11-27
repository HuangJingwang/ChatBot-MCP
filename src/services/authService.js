/**
 * 认证服务 - 处理用户登录和token管理
 */

// 使用 /api 前缀，通过 Vite 代理转发到后端服务器
const API_BASE_URL = '/api'
const LOGIN_ENDPOINT = '/User/login'

// localStorage keys
const TOKEN_KEY = 'auth_token'
const USER_INFO_KEY = 'user_info'
const IS_LOGGED_IN_KEY = 'is_logged_in'
const COOKIE_ID_KEY = 'cookie_id'
const USER_ORGANIZES_KEY = 'user_organizes'

/**
 * 登录
 * @param {string} userName - 用户名
 * @param {string} password - 密码
 * @param {string} countryCode - 国家代码（默认为 "86"）
 * @returns {Promise<Object>} 登录响应数据
 */
export const login = async (userName, password, countryCode = '86') => {
  try {
    // 优先使用已保存的 cookieId，如果没有则使用默认值
    const cookieId = localStorage.getItem(COOKIE_ID_KEY) || '65921143afdf8e07dbf16189'
    
    const response = await fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'appType': 'bct',
        'device': 'IOS',
        'language': 'zh',
        'cookieId': cookieId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userName,
        password,
        countryCode
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `登录失败: ${response.status} ${response.statusText}` 
      }))
      throw new Error(errorData.message || errorData.error || `登录失败: ${response.status}`)
    }

    const data = await response.json()
    
    // 检查登录是否成功
    if (data.isSuccess === true) {
      // 保存 cookieId
      if (data.cookieId) {
        localStorage.setItem(COOKIE_ID_KEY, data.cookieId)
      }
      
      // 保存用户组织信息
      if (data.organizes && Array.isArray(data.organizes) && data.organizes.length > 0) {
        localStorage.setItem(USER_ORGANIZES_KEY, JSON.stringify(data.organizes))
      }
      
      // 保存完整的用户信息
      const userInfo = {
        userId: data.userId || data.id,
        name: data.name,
        userName: data.userName,
        mobile: data.mobile,
        email: data.email,
        companyId: data.companyId,
        companyName: data.companyName,
        deptId: data.deptId,
        deptName: data.deptName,
        orgId: data.orgId,
        orgName: data.orgName,
        roles: data.roles || [],
        permissions: data.permissions || [],
        authorities: data.authorities || []
      }
      
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
      localStorage.setItem(IS_LOGGED_IN_KEY, 'true')
      
      // 如果有 token，也保存
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token)
      }
      
      return {
        success: true,
        cookieId: data.cookieId,
        organizes: data.organizes || [],
        userInfo,
        data
      }
    } else {
      // 登录失败
      throw new Error(data.message || '登录失败')
    }
  } catch (error) {
    console.error('登录错误:', error)
    throw error
  }
}

/**
 * 登出
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_INFO_KEY)
  localStorage.removeItem(IS_LOGGED_IN_KEY)
  localStorage.removeItem(COOKIE_ID_KEY)
  localStorage.removeItem(USER_ORGANIZES_KEY)
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export const isLoggedIn = () => {
  return localStorage.getItem(IS_LOGGED_IN_KEY) === 'true'
}

/**
 * 获取token
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 获取用户信息
 * @returns {Object|null}
 */
export const getUserInfo = () => {
  const userInfoStr = localStorage.getItem(USER_INFO_KEY)
  if (userInfoStr) {
    try {
      return JSON.parse(userInfoStr)
    } catch (e) {
      console.error('解析用户信息失败:', e)
      return null
    }
  }
  return null
}

/**
 * 设置认证token（用于后续API请求）
 * @param {string} token
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 获取 cookieId
 * @returns {string|null}
 */
export const getCookieId = () => {
  return localStorage.getItem(COOKIE_ID_KEY)
}

/**
 * 获取用户组织信息
 * @returns {Array|null}
 */
export const getUserOrganizes = () => {
  const organizesStr = localStorage.getItem(USER_ORGANIZES_KEY)
  if (organizesStr) {
    try {
      return JSON.parse(organizesStr)
    } catch (e) {
      console.error('解析用户组织信息失败:', e)
      return null
    }
  }
  return null
}

/**
 * 获取当前用户的主要组织信息（organizes 数组的第一项）
 * @returns {Object|null}
 */
export const getCurrentOrganize = () => {
  const organizes = getUserOrganizes()
  if (organizes && organizes.length > 0) {
    return organizes[0]
  }
  return null
}

