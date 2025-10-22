'use client'

import { useState } from 'react'

// 密码强度类型定义
interface PasswordStrength {
  level: number
  text: string
  color: string
}

// 密码配置类型定义
interface PasswordConfig {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
}

export default function PasswordGenerator() {
  // 密码配置状态
  const [config, setConfig] = useState<PasswordConfig>({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  })
  
  // 生成的密码
  const [password, setPassword] = useState<string>('')
  
  // 复制状态
  const [copied, setCopied] = useState<boolean>(false)

  /**
   * 生成随机密码
   */
  const generatePassword = (): void => {
    let charset = ''
    
    // 根据配置构建字符集
    if (config.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (config.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (config.includeNumbers) charset += '0123456789'
    if (config.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    // 检查是否至少选择了一种字符类型
    if (charset === '') {
      alert('请至少选择一种字符类型')
      return
    }
    
    // 生成随机密码
    let result = ''
    for (let i = 0; i < config.length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      result += charset.charAt(randomIndex)
    }
    
    setPassword(result)
    setCopied(false) // 重置复制状态
  }

  /**
   * 复制密码到剪贴板
   */
  const copyToClipboard = async (): Promise<void> => {
    if (!password) return
    
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      // 2秒后重置复制状态
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
      // 降级方案：使用传统的复制方法
      fallbackCopyTextToClipboard(password)
    }
  }

  /**
   * 降级复制方案（兼容旧浏览器）
   */
  const fallbackCopyTextToClipboard = (text: string): void => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // 避免滚动到底部
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('降级复制也失败了:', err)
    }
    
    document.body.removeChild(textArea)
  }

  /**
   * 计算密码强度
   */
  const getPasswordStrength = (pwd: string): PasswordStrength => {
    if (!pwd) return { level: 0, text: '无', color: 'text-gray-500' }
    
    let score = 0
    
    // 长度评分
    if (pwd.length >= 8) score += 1
    if (pwd.length >= 12) score += 1
    if (pwd.length >= 16) score += 1
    
    // 字符类型评分
    if (/[a-z]/.test(pwd)) score += 1  // 小写字母
    if (/[A-Z]/.test(pwd)) score += 1  // 大写字母
    if (/[0-9]/.test(pwd)) score += 1  // 数字
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1  // 特殊字符
    
    // 根据评分返回强度等级
    if (score <= 2) return { level: 1, text: '弱', color: 'text-red-600' }
    if (score <= 4) return { level: 2, text: '中', color: 'text-yellow-600' }
    return { level: 3, text: '强', color: 'text-green-600' }
  }

  /**
   * 更新配置的通用函数
   */
  const updateConfig = (key: keyof PasswordConfig, value: number | boolean): void => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 计算当前密码强度
  const strength = getPasswordStrength(password)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">密码生成器</h1>
          <p className="text-gray-600">生成安全的随机密码，保护您的账户安全</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* 密码长度设置 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码长度: <span className="text-blue-600 font-semibold">{config.length}</span>
            </label>
            <input
              type="range"
              min="4"
              max="50"
              value={config.length}
              onChange={(e) => updateConfig('length', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>4位</span>
              <span>50位</span>
            </div>
          </div>

          {/* 字符类型选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              包含字符类型:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeUppercase}
                  onChange={(e) => updateConfig('includeUppercase', e.target.checked)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="font-medium text-gray-900">大写字母</div>
                  <div className="text-sm text-gray-500">A-Z</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeLowercase}
                  onChange={(e) => updateConfig('includeLowercase', e.target.checked)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="font-medium text-gray-900">小写字母</div>
                  <div className="text-sm text-gray-500">a-z</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeNumbers}
                  onChange={(e) => updateConfig('includeNumbers', e.target.checked)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="font-medium text-gray-900">数字</div>
                  <div className="text-sm text-gray-500">0-9</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeSymbols}
                  onChange={(e) => updateConfig('includeSymbols', e.target.checked)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="font-medium text-gray-900">特殊符号</div>
                  <div className="text-sm text-gray-500">!@#$%^&*...</div>
                </div>
              </label>
            </div>
          </div>

          {/* 生成按钮 */}
          <div className="mb-6">
            <button
              onClick={generatePassword}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              🔐 生成新密码
            </button>
          </div>

          {/* 密码显示区域 */}
          {password && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                生成的密码:
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={password}
                  readOnly
                  className="flex-1 px-3 py-3 border border-gray-300 rounded-l-lg bg-gray-50 font-mono text-sm focus:outline-none select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-6 py-3 rounded-r-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    copied 
                      ? 'bg-green-600 text-white focus:ring-green-500' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500'
                  }`}
                >
                  {copied ? '✓ 已复制' : '📋 复制'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                点击密码框可全选，点击复制按钮复制到剪贴板
              </p>
            </div>
          )}

          {/* 密码强度指示器 */}
          {password && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">密码强度:</span>
                <span className={`text-sm font-semibold ${strength.color}`}>
                  {strength.text}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    strength.level === 1 ? 'bg-red-500 w-1/3' :
                    strength.level === 2 ? 'bg-yellow-500 w-2/3' : 'bg-green-500 w-full'
                  }`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>弱</span>
                <span>中</span>
                <span>强</span>
              </div>
            </div>
          )}

          {/* 安全提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">💡 安全提示</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 建议使用12位以上的密码</li>
              <li>• 包含多种字符类型可提高安全性</li>
              <li>• 不要在多个账户使用相同密码</li>
              <li>• 定期更换重要账户的密码</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}