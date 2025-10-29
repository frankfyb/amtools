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
  excludeSimilar: boolean
  excludeAmbiguous: boolean
  customSymbols: string
  minNumbers: number
  minSymbols: number
}

export default function PasswordGenerator() {
  // 密码配置状态
  const [config, setConfig] = useState<PasswordConfig>({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: false,
    excludeAmbiguous: false,
    customSymbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    minNumbers: 0,
    minSymbols: 0,
  })
  const [password, setPassword] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)
  const [isGenerating, setIsGenerating] = useState(false)

  /**
   * 生成随机密码
   */
  const generatePassword = (): void => {
    setIsGenerating(true)
    
    // 添加生成动画延迟
    setTimeout(() => {
      let charset = ''
      let uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      let lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
      let numberChars = '0123456789'
      let symbolChars = config.customSymbols || '!@#$%^&*()_+-=[]{}|;:,.<>?'
      
      // 排除相似字符
      if (config.excludeSimilar) {
        uppercaseChars = uppercaseChars.replace(/[IL]/g, '')
        lowercaseChars = lowercaseChars.replace(/[il]/g, '')
        numberChars = numberChars.replace(/[01]/g, '')
      }
      
      // 排除模糊字符
      if (config.excludeAmbiguous) {
        uppercaseChars = uppercaseChars.replace(/[O]/g, '')
        lowercaseChars = lowercaseChars.replace(/[o]/g, '')
        numberChars = numberChars.replace(/[0]/g, '')
        symbolChars = symbolChars.replace(/[{}[\]()\/\\'"~,;.<>]/g, '')
      }
      
      // 根据配置构建字符集
      if (config.includeUppercase) charset += uppercaseChars
      if (config.includeLowercase) charset += lowercaseChars
      if (config.includeNumbers) charset += numberChars
      if (config.includeSymbols) charset += symbolChars
      
      // 检查是否至少选择了一种字符类型
      if (charset === '') {
        alert('请至少选择一种字符类型')
        setIsGenerating(false)
        return
      }
      
      // 生成随机密码
      let result = ''
      let requiredChars = ''
      
      // 确保包含最少数量的数字
      if (config.includeNumbers && config.minNumbers > 0) {
        for (let i = 0; i < Math.min(config.minNumbers, config.length); i++) {
          const randomIndex = Math.floor(Math.random() * numberChars.length)
          requiredChars += numberChars.charAt(randomIndex)
        }
      }
      
      // 确保包含最少数量的符号
      if (config.includeSymbols && config.minSymbols > 0) {
        for (let i = 0; i < Math.min(config.minSymbols, config.length - requiredChars.length); i++) {
          const randomIndex = Math.floor(Math.random() * symbolChars.length)
          requiredChars += symbolChars.charAt(randomIndex)
        }
      }
      
      // 生成剩余字符
      for (let i = requiredChars.length; i < config.length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length)
        result += charset.charAt(randomIndex)
      }
      
      // 将必需字符随机插入到密码中
      const resultArray = result.split('')
      for (const char of requiredChars) {
        const randomIndex = Math.floor(Math.random() * (resultArray.length + 1))
        resultArray.splice(randomIndex, 0, char)
      }
      
      // 如果超过长度限制，截取到指定长度
      result = resultArray.slice(0, config.length).join('')
      
      setPassword(result)
      setCopied(false) // 重置复制状态
      setIsGenerating(false)
    }, 500)
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
    if (!pwd) return { level: 0, text: '无', color: 'text-slate-500' }
    
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
    if (score <= 2) return { level: 1, text: '弱', color: 'text-red-500' }
    if (score <= 4) return { level: 2, text: '中', color: 'text-amber-500' }
    return { level: 3, text: '强', color: 'text-emerald-500' }
  }

  /**
   * 更新配置的通用函数
   */
  const updateConfig = (key: keyof PasswordConfig, value: number | boolean | string): void => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 计算当前密码强度
  const strength = getPasswordStrength(password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-2 sm:py-4 lg:py-6 px-4">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 - 优化PC端间距 */}
          <div className="text-left mb-6 sm:mb-8 lg:mb-10">
            {/* 图标容器 - 使用更现代的设计 */}
            <div className="relative inline-flex items-center justify-center mb-4 sm:mb-6 lg:mb-8">
              {/* 背景光晕效果 */}
              <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-emerald-400/20 via-blue-500/20 to-purple-600/20 rounded-3xl blur-xl animate-pulse"></div>
              
              {/* 主图标容器 */}
              <div className="relative w-14 h-14 sm:w-18 sm:h-18 lg:w-22 lg:h-22 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/25 flex items-center justify-center transform hover:scale-105 transition-all duration-300">
                {/* 内层装饰 */}
                <div className="absolute inset-1 bg-gradient-to-br from-white/10 to-transparent rounded-xl"></div>
                
                {/* 锁图标 - 使用更精美的设计 */}
                <svg className="w-7 h-7 sm:w-9 sm:h-9 lg:w-11 lg:h-11 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  {/* 添加钥匙孔装饰 */}
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
                
                {/* 闪光效果 */}
                <div className="absolute top-2 left-2 w-2 h-2 bg-white/40 rounded-full blur-sm"></div>
              </div>
            </div>

            {/* 标题 - 使用更优雅的渐变和字体 */}
            <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-3 sm:mb-4 lg:mb-6 tracking-tight">
              <span className="inline-block transform hover:scale-105 transition-transform duration-300">
                密码生成器
              </span>
            </h3>
            
            {/* 副标题 - 一行显示，字体适中 */}
            <div className="max-w-4xl mx-auto px-4">
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                🔐 生成安全可靠的随机密码，保护您的数字账户安全，支持多种字符组合和自定义规则
              </p>
            </div>
            
            {/* 装饰性元素 */}
            <div className="flex items-center justify-center mt-4 sm:mt-6 lg:mt-8 space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
          
          {/* PC端使用两列布局，移动端保持单列 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
            {/* 左列：配置选项 */}
            <div className="lg:sticky lg:top-4 lg:h-fit">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 p-3 sm:p-6 lg:p-6">
                {/* 密码长度设置 */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <label className="text-base lg:text-lg font-semibold text-slate-800">
                      密码长度
                    </label>
                    <div className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-sm sm:text-base lg:text-lg min-w-[60px] text-center">
                      {config.length}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="4"
                      max="50"
                      value={config.length}
                      onChange={(e) => updateConfig('length', parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full appearance-none cursor-pointer slider focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                      style={{
                        background: `linear-gradient(to right, #6366f1 0%, #3b82f6 ${(config.length - 4) / 46 * 50}%, #06b6d4 ${(config.length - 4) / 46 * 100}%, #e2e8f0 ${(config.length - 4) / 46 * 100}%, #e2e8f0 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs sm:text-sm text-slate-500 mt-2">
                      <span className="font-medium">4位</span>
                      <span className="font-medium">50位</span>
                    </div>
                  </div>
                </div>

                {/* 字符类型选择 */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-base lg:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
                    包含字符类型
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3">
                    <label className={`group relative flex items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      config.includeUppercase 
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/10' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}>
                      <input
                        type="checkbox"
                        checked={config.includeUppercase}
                        onChange={(e) => updateConfig('includeUppercase', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-lg border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                        config.includeUppercase 
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-blue-500' 
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}>
                        {config.includeUppercase && (
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 mb-0.5 text-xs sm:text-sm">大写字母</div>
                        <div className="text-xs text-slate-500 font-mono">A-Z</div>
                      </div>
                    </label>
                    
                    <label className={`group relative flex items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      config.includeLowercase 
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/10' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}>
                      <input
                        type="checkbox"
                        checked={config.includeLowercase}
                        onChange={(e) => updateConfig('includeLowercase', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-lg border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                        config.includeLowercase 
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-blue-500' 
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}>
                        {config.includeLowercase && (
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 mb-0.5 text-xs sm:text-sm">小写字母</div>
                        <div className="text-xs text-slate-500 font-mono">a-z</div>
                      </div>
                    </label>
                    
                    <label className={`group relative flex items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      config.includeNumbers 
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/10' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}>
                      <input
                        type="checkbox"
                        checked={config.includeNumbers}
                        onChange={(e) => updateConfig('includeNumbers', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-lg border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                        config.includeNumbers 
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-blue-500' 
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}>
                        {config.includeNumbers && (
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 mb-0.5 text-xs sm:text-sm">数字</div>
                        <div className="text-xs text-slate-500 font-mono">0-9</div>
                      </div>
                    </label>
                    
                    <label className={`group relative flex items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      config.includeSymbols 
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/10' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}>
                      <input
                        type="checkbox"
                        checked={config.includeSymbols}
                        onChange={(e) => updateConfig('includeSymbols', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-lg border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                        config.includeSymbols 
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-blue-500' 
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}>
                        {config.includeSymbols && (
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 mb-0.5 text-xs sm:text-sm">特殊符号</div>
                        <div className="text-xs text-slate-500 font-mono">!@#$%^&*...</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 高级选项 */}
                <div className="mb-0">
                  <label className="block text-base lg:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
                    高级选项
                  </label>
                  
                  {/* 排除选项 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <label className={`group relative flex items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      config.excludeSimilar 
                        ? 'border-amber-500 bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/10' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}>
                      <input
                        type="checkbox"
                        checked={config.excludeSimilar}
                        onChange={(e) => updateConfig('excludeSimilar', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-lg border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                        config.excludeSimilar 
                          ? 'border-amber-500 bg-gradient-to-br from-amber-500 to-orange-500' 
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}>
                        {config.excludeSimilar && (
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 mb-0.5 text-xs sm:text-sm">排除相似字符</div>
                        <div className="text-xs text-slate-500 font-mono">I, l, 1, 0, O</div>
                      </div>
                    </label>
                    
                    <label className={`group relative flex items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      config.excludeAmbiguous 
                        ? 'border-amber-500 bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/10' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}>
                      <input
                        type="checkbox"
                        checked={config.excludeAmbiguous}
                        onChange={(e) => updateConfig('excludeAmbiguous', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-lg border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                        config.excludeAmbiguous 
                          ? 'border-amber-500 bg-gradient-to-br from-amber-500 to-orange-500' 
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}>
                        {config.excludeAmbiguous && (
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 mb-0.5 text-xs sm:text-sm">排除模糊字符</div>
                        <div className="text-xs text-slate-500 font-mono">{}, [], (), /, \, &apos;, &quot;, ~</div>
                      </div>
                    </label>
                  </div>

              {/* 自定义符号 */}
              {config.includeSymbols && (
                <div className="mb-4 sm:mb-6">
                  <label className="block text-base font-semibold text-slate-800 mb-2 sm:mb-3">
                    自定义符号
                  </label>
                  <input
                    type="text"
                    value={config.customSymbols}
                    onChange={(e) => updateConfig('customSymbols', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors duration-200 font-mono text-sm sm:text-base"
                    placeholder="输入自定义符号..."
                  />
                  <p className="text-xs sm:text-sm text-slate-500 mt-2">
                    自定义要包含在密码中的特殊符号
                  </p>
                </div>
              )}
              
              {/* 最少字符数量 */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {config.includeNumbers && (
                  <div>
                    <label className="block text-base font-semibold text-slate-800 mb-2 sm:mb-3">
                      最少数字数量
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="0"
                        max={Math.min(10, config.length)}
                        value={config.minNumbers}
                        onChange={(e) => updateConfig('minNumbers', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer slider-mini"
                      />
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-sm min-w-[40px] text-center">
                        {config.minNumbers}
                      </div>
                    </div>
                  </div>
                )}
                
                {config.includeSymbols && (
                  <div>
                    <label className="block text-base font-semibold text-slate-800 mb-2 sm:mb-3">
                      最少符号数量
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="0"
                        max={Math.min(10, config.length)}
                        value={config.minSymbols}
                        onChange={(e) => updateConfig('minSymbols', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer slider-mini"
                      />
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg font-bold text-sm min-w-[40px] text-center">
                        {config.minSymbols}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
                {/* 右列：密码生成和显示 */}
          <div className="mt-6 md:mt-0">
              {/* 生成按钮 */}
            <div className="mb-6 sm:mb-8">
              <button
                onClick={generatePassword}
                disabled={isGenerating}
                className={`w-full font-bold py-3 sm:py-4 px-6 rounded-xl sm:rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-lg shadow-indigo-500/25 transform text-base sm:text-lg ${
                  isGenerating 
                    ? 'bg-gradient-to-r from-slate-400 to-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 hover:from-indigo-600 hover:via-blue-600 hover:to-cyan-600 text-white hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="text-white">生成中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>生成新密码</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* 密码显示区域 */}
            {password && (
              <div className="mb-6 sm:mb-8 animate-fade-in">
                <label className="block text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
                  生成的密码
                </label>
                <div className="relative">
                  <div className="flex flex-col sm:flex-row rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                    <input
                      type="text"
                      value={password}
                      readOnly
                      className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 font-mono text-sm sm:text-lg text-slate-800 focus:outline-none select-all border-b sm:border-b-0 sm:border-r border-slate-200 hover:bg-slate-100 transition-colors duration-200"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={copyToClipboard}
                      className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all duration-300 focus:outline-none min-w-[100px] sm:min-w-[120px] transform hover:scale-105 active:scale-95 ${
                        copied 
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white animate-pulse' 
                          : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        {copied ? (
                          <>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm sm:text-base">已复制</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm sm:text-base">复制</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 sm:mt-3 text-center animate-fade-in-delay">
                    点击密码框可全选，点击复制按钮复制到剪贴板
                  </p>
                </div>
              </div>
            )}

            {/* 密码强度指示器 */}
            {password && (
              <div className="mb-6 sm:mb-8 animate-fade-in-delay">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-base sm:text-lg font-semibold text-slate-800">密码强度</span>
                  <span className={`text-base sm:text-lg font-bold ${strength.color} animate-pulse`}>
                    {strength.text}
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-slate-200 rounded-full h-3 sm:h-4 overflow-hidden">
                    <div
                      className={`h-3 sm:h-4 rounded-full transition-all duration-1000 ease-out animate-strength-fill ${
                        strength.level === 1 ? 'bg-gradient-to-r from-red-500 to-red-600 w-1/3' :
                        strength.level === 2 ? 'bg-gradient-to-r from-amber-500 to-orange-500 w-2/3' : 
                        'bg-gradient-to-r from-emerald-500 to-green-500 w-full'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-slate-500 mt-2">
                    <span className="font-medium">弱</span>
                    <span className="font-medium">中</span>
                    <span className="font-medium">强</span>
                  </div>
                </div>
              </div>
            )}

            {/* 安全提示 */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 border border-blue-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">安全提示</h3>
              </div>
              <ul className="text-slate-700 space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></div>
                  <span>建议使用12位以上的密码</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></div>
                  <span>包含多种字符类型可提高安全性</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></div>
                  <span>不要在多个账户使用相同密码</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></div>
                  <span>定期更换重要账户的密码</span>
                </li>
              </ul>
            </div>
          </div>
    </div>
  </div>
  </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fadeIn 0.5s ease-out 0.2s both;
        }
        
        .animate-strength-fill {
          animation: strengthFill 0.8s ease-out;
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
        
        @keyframes strengthFill {
          from {
            width: 0;
          }
          to {
            width: var(--target-width);
          }
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.6);
        }
        
        .slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          transition: all 0.2s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.6);
        }
        
        .slider-mini::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
          transition: all 0.2s ease;
        }
        
        .slider-mini::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6);
        }
        
        .slider-mini::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
          transition: all 0.2s ease;
        }
        
        .slider-mini::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6);
        }
      `}</style>
    </div>
  )
}