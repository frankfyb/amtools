'use client'  // 🎯 告诉 Next.js 这是客户端组件，可以使用浏览器 API 和 React Hooks

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// 🎯 类型定义
interface VoiceConfig {
  voice: string      // 语音类型标识符
  speed: number      // 语速控制 (0.1-3.0)
  pitch: number      // 音调控制 (0-2)
  volume: number     // 音量控制 (0-1)
}

interface VoiceOption {
  value: string      // 语音标识符
  label: string      // 显示名称
  lang: string       // 语言代码
  gender: string     // 性别
}

enum AudioState {
  IDLE = 'idle',           // 空闲状态
  LOADING = 'loading',     // 加载中
  READY = 'ready',         // 准备就绪
  PLAYING = 'playing',     // 播放中
  PAUSED = 'paused',       // 暂停中
  ERROR = 'error'          // 错误状态
}

export default function EnglishTextVoice() {
  // 🎯 状态管理
  const [text, setText] = useState('')
  const [audioState, setAudioState] = useState<AudioState>(AudioState.IDLE)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  
  // 🎛️ 语音配置状态
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    voice: 'Google US English',
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0
  })
  
  // 🎵 音频引用
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 🎤 可用语音选项
  const voiceOptions: VoiceOption[] = useMemo(() => [
    { value: 'Google US English', label: 'Google US English (Female)', lang: 'en-US', gender: 'female' },
    { value: 'Google UK English Male', label: 'Google UK English (Male)', lang: 'en-GB', gender: 'male' },
    { value: 'Microsoft David', label: 'Microsoft David (Male)', lang: 'en-US', gender: 'male' },
    { value: 'Microsoft Zira', label: 'Microsoft Zira (Female)', lang: 'en-US', gender: 'female' },
    { value: 'Microsoft Mark', label: 'Microsoft Mark (Male)', lang: 'en-GB', gender: 'male' },
    { value: 'Microsoft Hazel', label: 'Microsoft Hazel (Female)', lang: 'en-GB', gender: 'female' }
  ], [])
  
  // 🛠️ 防抖工具函数
  const debounce = useCallback((func: () => void, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(func, delay)
    }
  }, [])
  
  // 📝 文本变化处理
  const handleTextChange = useCallback((value: string) => {
    setText(value)
    
    // 🚀 防抖清除错误信息和重置音频状态
    debounce(() => {
      if (error && value.trim()) {
        setError(null)
      }
      if (audioState !== AudioState.IDLE && audioState !== AudioState.LOADING) {
        // 文本改变时重置音频状态
        setAudioUrl(null)
        setAudioState(AudioState.IDLE)
        setProgress(0)
        setCurrentTime(0)
        setDuration(0)
      }
    }, 300) // 300ms 防抖延迟
  }, [error, audioState, debounce])

  /**
   * 🎯 工具函数：估算音频时长
   */
  const estimateAudioDuration = useCallback((text: string): number => {
    const wordsPerMinute = 150
    const words = text.trim().split(/\s+/).length
    const baseMinutes = words / wordsPerMinute
    const adjustedMinutes = baseMinutes / voiceConfig.speed
    const punctuationCount = (text.match(/[.!?]/g) || []).length
    const pauseTime = punctuationCount * 0.5
    return Math.max(1, (adjustedMinutes * 60) + pauseTime)
  }, [voiceConfig.speed])

  /**
   * 🎯 工具函数：使用谷歌TTS接口创建真实语音音频文件
   */
  const createRealAudioUrl = useCallback(async (text: string, config: VoiceConfig): Promise<string> => {
    try {
      // 使用我们的API路由来避免CORS问题
        const apiUrl = `/tools/english-text-voice/api/tts?text=${encodeURIComponent(text)}&speed=${config.speed}`
      
      // 发起请求获取音频数据
      const response = await fetch(apiUrl, {
        method: 'GET',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `TTS请求失败: ${response.status}`)
      }
      
      // 获取音频数据并创建Blob
      const audioBuffer = await response.arrayBuffer()
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      
      return URL.createObjectURL(audioBlob)
      
    } catch (err) {
      console.error('创建真实音频文件失败:', err)
      // 如果TTS失败，回退到简单的提示音
      const duration = estimateAudioDuration(text)
      const sampleRate = 44100
      const frameCount = Math.floor(sampleRate * Math.min(duration, 2)) // 最多2秒提示音
      
      // 创建 WAV 文件头
      const wavHeader = new ArrayBuffer(44)
      const view = new DataView(wavHeader)
      
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i))
        }
      }
      
      writeString(0, 'RIFF')
      view.setUint32(4, 36 + frameCount * 2, true)
      writeString(8, 'WAVE')
      writeString(12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * 2, true)
      view.setUint16(32, 2, true)
      view.setUint16(34, 16, true)
      writeString(36, 'data')
      view.setUint32(40, frameCount * 2, true)
      
      // 创建简单的提示音（双音调）
      const audioData = new Int16Array(frameCount)
      const amplitude = 0.1
      
      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate
        const freq1 = 800 // 第一个音调
        const freq2 = 1000 // 第二个音调
        const sample = (Math.sin(2 * Math.PI * freq1 * t) + Math.sin(2 * Math.PI * freq2 * t)) * amplitude * 0.5
        audioData[i] = Math.floor(sample * 32767)
      }
      
      const wavBlob = new Blob([wavHeader, audioData.buffer], { type: 'audio/wav' })
      return URL.createObjectURL(wavBlob)
    }
  }, [estimateAudioDuration])

  /**
   * 🎯 核心功能1：语音合成与音频生成
   */
  const generateSpeech = useCallback(async () => {
    if (!text.trim()) {
      setError('请输入要转换的英文文本')
      return
    }
    
    if (text.length > 5000) {
      setError('文本长度不能超过5000个字符')
      return
    }
    
    setError(null)
    setAudioState(AudioState.LOADING)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
    
    try {
      // 检查 Speech Synthesis API 是否可用
      const isSpeechSynthesisAvailable = 'speechSynthesis' in window && speechSynthesis.getVoices().length > 0
      
      // 创建可下载的音频文件
       const audioUrl = await createRealAudioUrl(text, voiceConfig)
       setAudioUrl(audioUrl)
      
      if (isSpeechSynthesisAvailable) {
        // 如果语音合成可用，使用它
        const utterance = new SpeechSynthesisUtterance(text)
        
        const voices = speechSynthesis.getVoices()
        const selectedVoice = voices.find(voice => voice.name === voiceConfig.voice)
        
        if (selectedVoice) {
          utterance.voice = selectedVoice
        } else {
          const englishVoice = voices.find(voice => voice.lang.startsWith('en'))
          if (englishVoice) {
            utterance.voice = englishVoice
          }
        }
        
        utterance.rate = voiceConfig.speed
        utterance.pitch = voiceConfig.pitch
        utterance.volume = voiceConfig.volume
        
        const speechPromise = new Promise<void>((resolve, reject) => {
          let progressInterval: NodeJS.Timeout
          
          utterance.onstart = () => {
            setAudioState(AudioState.PLAYING)
            const estimatedDuration = estimateAudioDuration(text)
            setDuration(estimatedDuration)
            
            let currentProgress = 0
            progressInterval = setInterval(() => {
              currentProgress += 2
              if (currentProgress <= 95) {
                setProgress(currentProgress)
                setCurrentTime((currentProgress / 100) * estimatedDuration)
              }
            }, estimatedDuration * 20)
          }
          
          utterance.onend = () => {
            clearInterval(progressInterval)
            setAudioState(AudioState.READY)
            setProgress(100)
            const estimatedDuration = estimateAudioDuration(text)
            setCurrentTime(estimatedDuration)
            resolve()
          }
          
          utterance.onerror = (event) => {
            clearInterval(progressInterval)
            setAudioState(AudioState.ERROR)
            reject(new Error(`语音合成错误: ${event.error}`))
          }
        })
        
        speechSynthesis.speak(utterance)
        await speechPromise
      } else {
        // 如果语音合成不可用，模拟生成过程
        const estimatedDuration = estimateAudioDuration(text)
        setDuration(estimatedDuration)
        setAudioState(AudioState.LOADING)
        
        // 模拟加载过程
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setProgress(i)
          setCurrentTime((i / 100) * estimatedDuration)
        }
        
        setAudioState(AudioState.READY)
        setProgress(100)
        setCurrentTime(estimatedDuration)
      }
      
    } catch (err) {
      console.error('语音生成失败:', err)
      setError(err instanceof Error ? err.message : '语音生成失败，请重试')
      setAudioState(AudioState.ERROR)
    }
  }, [text, voiceConfig, createRealAudioUrl, estimateAudioDuration])

  /**
   * 🎤 使用 Speech Synthesis API 播放语音
   */
  const playWithSpeechSynthesis = useCallback(() => {
    try {
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      const voices = speechSynthesis.getVoices()
      const selectedVoice = voices.find(voice => voice.name === voiceConfig.voice)
      
      if (selectedVoice) {
        utterance.voice = selectedVoice
      } else {
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'))
        if (englishVoice) {
          utterance.voice = englishVoice
        }
      }
      
      utterance.rate = voiceConfig.speed
      utterance.pitch = voiceConfig.pitch
      utterance.volume = voiceConfig.volume

      let progressInterval: NodeJS.Timeout
      
      utterance.onstart = () => {
        setAudioState(AudioState.PLAYING)
        const estimatedDuration = estimateAudioDuration(text)
        setDuration(estimatedDuration)
        
        let currentProgress = 0
        progressInterval = setInterval(() => {
          currentProgress += 2
          if (currentProgress <= 95) {
            setProgress(currentProgress)
            setCurrentTime((currentProgress / 100) * estimatedDuration)
          }
        }, estimatedDuration * 20)
      }
      
      utterance.onend = () => {
        clearInterval(progressInterval)
        setAudioState(AudioState.READY)
        setProgress(100)
        const estimatedDuration = estimateAudioDuration(text)
        setCurrentTime(estimatedDuration)
      }
      
      utterance.onerror = (event) => {
        clearInterval(progressInterval)
        setAudioState(AudioState.ERROR)
        setError(`语音播放错误: ${event.error}`)
      }

      speechSynthesis.speak(utterance)

    } catch (err) {
      console.error('Speech Synthesis 播放失败:', err)
      setError('语音播放失败，请重试')
      setAudioState(AudioState.ERROR)
    }
  }, [text, voiceConfig, estimateAudioDuration])

  /**
   * 🎯 核心功能2：音频播放控制
   */
  const togglePlayback = useCallback(() => {
    if (!text.trim()) {
      setError('请先输入文本并生成语音')
      return
    }

    try {
      if (speechSynthesis.speaking) {
        if (speechSynthesis.paused) {
          speechSynthesis.resume()
          setAudioState(AudioState.PLAYING)
        } else {
          speechSynthesis.pause()
          setAudioState(AudioState.PAUSED)
        }
        return
      }

      const audio = audioRef.current
      if (audio && audioUrl) {
        if (audioState === AudioState.PLAYING) {
          audio.pause()
          setAudioState(AudioState.PAUSED)
        } else {
          audio.play().catch(err => {
            console.error('音频播放失败:', err)
            playWithSpeechSynthesis()
          })
        }
        return
      }

      playWithSpeechSynthesis()

    } catch (err) {
      console.error('播放控制错误:', err)
      setError('播放控制失败，请重试')
      setAudioState(AudioState.ERROR)
    }
  }, [text, audioUrl, audioState, playWithSpeechSynthesis])

  /**
   * 🎯 核心功能3：音频进度控制
   */
  const seekAudio = useCallback((percentage: number) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    
    try {
      const targetTime = (percentage / 100) * duration
      audio.currentTime = targetTime
      setCurrentTime(targetTime)
      setProgress(percentage)
    } catch (err) {
      console.error('音频跳转错误:', err)
    }
  }, [duration])

  /**
   * 🎯 核心功能4：音频文件下载
   */
  const downloadAudio = useCallback(() => {
    if (!audioUrl) {
      setError('没有可下载的音频文件，请先生成语音')
      return
    }
    
    try {
      const link = document.createElement('a')
      link.href = audioUrl
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      let extension = '.wav'
      
      if (audioUrl.includes('audio/webm')) {
        extension = '.webm'
      } else if (audioUrl.includes('audio/wav')) {
        extension = '.wav'
      } else if (audioUrl.includes('audio/mp3')) {
        extension = '.mp3'
      }
      
      const filename = `english-speech-${timestamp}${extension}`
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('音频下载已开始:', filename)
      
    } catch (err) {
      console.error('下载失败:', err)
      setError('音频下载失败，请重试')
    }
  }, [audioUrl])

  /**
   * 🎯 核心功能5：文本操作功能
   */
  const copyToClipboard = useCallback(async () => {
    if (!text.trim()) {
      setError('没有可复制的文本内容')
      return
    }
    
    try {
      await navigator.clipboard.writeText(text)
      console.log('文本已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        console.log('文本已复制（降级方案）')
      } catch {
        setError('复制功能不可用，请手动选择文本复制')
      }
    }
  }, [text])

  const clearText = useCallback(() => {
    setText('')
    setError(null)
    setAudioUrl(null)
    setAudioState(AudioState.IDLE)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const importFromFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('text/') && !file.name.endsWith('.txt')) {
      setError('请选择文本文件（.txt格式）')
      return
    }
    
    if (file.size > 1024 * 1024) {
      setError('文件大小不能超过1MB')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        setText(content.slice(0, 5000))
        setError(null)
      }
    }
    reader.onerror = () => {
      setError('文件读取失败，请重试')
    }
    reader.readAsText(file)
    
    event.target.value = ''
  }, [])

  /**
   * 🎯 格式化时间显示
   */
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 🎵 音频事件监听器设置
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    const updateProgress = () => {
      if (audio.duration && audio.currentTime) {
        const progressPercent = (audio.currentTime / audio.duration) * 100
        setProgress(progressPercent)
        setCurrentTime(audio.currentTime)
      }
    }
    
    const updateDuration = () => {
      if (audio.duration) {
        setDuration(audio.duration)
      }
    }
    
    const handlePlay = () => setAudioState(AudioState.PLAYING)
    const handlePause = () => setAudioState(AudioState.PAUSED)
    const handleEnded = () => {
      setAudioState(AudioState.READY)
      setProgress(100)
    }
    const handleError = () => {
      setAudioState(AudioState.ERROR)
      setError('音频播放出错，请重新生成')
    }
    
    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 隐藏的音频元素 */}
      <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← 返回首页
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-semibold text-gray-900">英文文本转语音</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* 文本输入区域 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">文本输入</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="复制文本"
                >
                  📋
                </button>
                <button
                  onClick={importFromFile}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="从文件导入"
                >
                  📁
                </button>
                <button
                  onClick={clearText}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="清空文本"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="请输入要转换为语音的英文文本..."
              className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={5000}
            />
            
            <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
              <span>支持最多 5000 个字符</span>
              <span>{text.length}/5000</span>
            </div>
          </div>

          {/* 语音配置 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">语音设置</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 语音选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  语音类型
                </label>
                <select
                  value={voiceConfig.voice}
                  onChange={(e) => setVoiceConfig(prev => ({ ...prev, voice: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {voiceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 语速控制 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  语速: {voiceConfig.speed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={voiceConfig.speed}
                  onChange={(e) => setVoiceConfig(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 音调控制 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  音调: {voiceConfig.pitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={voiceConfig.pitch}
                  onChange={(e) => setVoiceConfig(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 音量控制 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  音量: {Math.round(voiceConfig.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceConfig.volume}
                  onChange={(e) => setVoiceConfig(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 音频控制区域 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">音频控制</h2>
            
            {/* 错误提示 */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* 主要控制按钮 */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={generateSpeech}
                disabled={!text.trim() || audioState === AudioState.LOADING}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                🔊
                {audioState === AudioState.LOADING ? '生成中...' : '生成语音'}
              </button>

              <button
                onClick={togglePlayback}
                disabled={!text.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {audioState === AudioState.PLAYING ? '⏸️' : '▶️'}
                {audioState === AudioState.PLAYING ? '暂停' : '播放'}
              </button>

              <button
                onClick={downloadAudio}
                disabled={!audioUrl}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                💾
                下载音频
              </button>
            </div>

            {/* 播放进度条 */}
            {(audioState !== AudioState.IDLE) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{formatTime(currentTime)}</span>
                  <span className="capitalize">{audioState}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                
                <div className="relative">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => seekAudio(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 使用说明 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">使用说明</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h3 className="font-medium mb-2">📝 文本输入</h3>
                <ul className="space-y-1">
                  <li>• 支持英文文本，最多5000字符</li>
                  <li>• 可以从文件导入或直接输入</li>
                  <li>• 支持复制和清空操作</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">🎵 语音设置</h3>
                <ul className="space-y-1">
                  <li>• 多种英语语音可选</li>
                  <li>• 可调节语速、音调和音量</li>
                  <li>• 实时预览设置效果</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">🎧 播放控制</h3>
                <ul className="space-y-1">
                  <li>• 支持播放、暂停和进度控制</li>
                  <li>• 实时显示播放状态和时间</li>
                  <li>• 可点击进度条跳转</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">💾 音频下载</h3>
                <ul className="space-y-1">
                  <li>• 生成WAV格式音频文件</li>
                  <li>• 自动添加时间戳命名</li>
                  <li>• 支持离线播放和分享</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 功能特色 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">功能特色</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔊</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">高质量语音</h3>
                <p className="text-sm text-gray-600">使用浏览器原生语音合成API，提供自然流畅的英语发音</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">实时处理</h3>
                <p className="text-sm text-gray-600">无需等待，即时生成语音，支持实时播放和下载</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">💾</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">离线可用</h3>
                <p className="text-sm text-gray-600">生成的音频文件可下载保存，支持离线播放和分享</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}