import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text')
    const speed = searchParams.get('speed') || '1.0'
    
    console.log('TTS请求参数:', { text: text?.substring(0, 100) + '...', speed, textLength: text?.length })
    
    if (!text) {
      return NextResponse.json({ error: '缺少文本参数' }, { status: 400 })
    }
    
    // 使用智能文本分块处理长文本
    if (text.length > 300) {
      console.log('文本较长，使用分块处理:', text.length, '字符')
      return await processLongText(text, speed)
    }
    
    return await processTextToSpeech(text, speed)
    
  } catch (error) {
    console.error('TTS API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, speed = '1.0' } = body
    
    console.log('TTS POST请求参数:', { text: text?.substring(0, 100) + '...', speed, textLength: text?.length })
    
    if (!text) {
      return NextResponse.json({ error: '缺少文本参数' }, { status: 400 })
    }
    
    // 使用智能文本分块处理长文本
    if (text.length > 300) {
      console.log('文本较长，使用分块处理:', text.length, '字符')
      return await processLongText(text, speed)
    }
    
    return await processTextToSpeech(text, speed)
    
  } catch (error) {
    console.error('TTS POST API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

async function callGoogleTTS(text: string, speed: string) {
  try {
    // URL编码文本
    const encodedText = encodeURIComponent(text)
    
    // 构造谷歌TTS请求URL - 使用gtx client参数支持更长文本
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&speed=${speed}&client=gtx`
    
    console.log('请求TTS URL:', ttsUrl.substring(0, 150) + '...')
    
    // 发起请求获取音频数据
    const response = await fetch(ttsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    })
    
    console.log('TTS响应状态:', response.status, response.statusText)
    
    if (!response.ok) {
      // 尝试获取错误响应内容
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`TTS请求失败: ${response.status} - ${errorText}`)
      return NextResponse.json({ error: `TTS服务不可用: ${response.status}` }, { status: 502 })
    }
    
    // 获取音频数据
    const audioBuffer = await response.arrayBuffer()
    
    console.log('音频数据大小:', audioBuffer.byteLength, 'bytes')
    
    // 返回音频数据
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
      },
    })
    
  } catch (error) {
    console.error('callGoogleTTS错误:', error)
    return NextResponse.json({ error: '语音合成失败' }, { status: 500 })
  }
}

async function processTextToSpeech(text: string, speed: string) {
  // 对于短文本，直接调用Google TTS API
  return await callGoogleTTS(text, speed)
}

async function processLongText(text: string, speed: string) {
  try {
    console.log('开始处理长文本，长度:', text.length)
    
    // 智能分割文本 - 按句子分割，每块最多200字符（保守估计）
    const chunks = splitTextIntoChunks(text, 200)
    console.log('文本分割为', chunks.length, '块')
    
    const audioBuffers: ArrayBuffer[] = []
    
    // 逐个处理每个文本块
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`处理第 ${i + 1}/${chunks.length} 块，长度: ${chunk.length}`)
      
      // 直接调用Google TTS API，不再通过processTextToSpeech避免递归
      const response = await callGoogleTTS(chunk, speed)
      
      if (response.status !== 200) {
        console.error(`第 ${i + 1} 块处理失败`)
        return response // 返回错误响应
      }
      
      const audioBuffer = await response.arrayBuffer()
      audioBuffers.push(audioBuffer)
      
      // 添加短暂延迟避免请求过于频繁
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    // 合并所有音频数据
    const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
    const mergedBuffer = new Uint8Array(totalLength)
    
    let offset = 0
    for (const buffer of audioBuffers) {
      mergedBuffer.set(new Uint8Array(buffer), offset)
      offset += buffer.byteLength
    }
    
    console.log('合并完成，总音频大小:', mergedBuffer.byteLength, 'bytes')
    
    return new NextResponse(mergedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': mergedBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    })
    
  } catch (error) {
    console.error('processLongText错误:', error)
    return NextResponse.json({ error: '长文本处理失败' }, { status: 500 })
  }
}

function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = []
  
  // 首先按句子分割（以句号、问号、感叹号为分界）
  const sentences = text.split(/([.!?]+\s*)/).filter(s => s.trim().length > 0)
  
  let currentChunk = ''
  
  for (const sentence of sentences) {
    // 如果当前块加上新句子不超过限制，就添加到当前块
    if (currentChunk.length + sentence.length <= maxChunkSize) {
      currentChunk += sentence
    } else {
      // 如果当前块不为空，先保存它
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim())
      }
      
      // 如果单个句子就超过限制，需要进一步分割
      if (sentence.length > maxChunkSize) {
        const words = sentence.split(' ')
        let wordChunk = ''
        
        for (const word of words) {
          if (wordChunk.length + word.length + 1 <= maxChunkSize) {
            wordChunk += (wordChunk ? ' ' : '') + word
          } else {
            if (wordChunk.trim().length > 0) {
              chunks.push(wordChunk.trim())
            }
            wordChunk = word
          }
        }
        
        currentChunk = wordChunk
      } else {
        currentChunk = sentence
      }
    }
  }
  
  // 添加最后一块
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}