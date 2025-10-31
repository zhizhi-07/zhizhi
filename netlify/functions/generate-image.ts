import type { Handler } from '@netlify/functions'

const handler: Handler = async (event) => {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // 处理OPTIONS预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // 只接受POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { prompt } = JSON.parse(event.body || '{}')

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing prompt parameter' })
      }
    }

    console.log('🎨 收到图片生成请求:', prompt)

    // 🔑 从环境变量获取API配置
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
    const FLUX_API_URL = process.env.FLUX_API_URL
    const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
    const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN

    // 优先使用 Cloudflare Workers AI (免费且快速)
    if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
      console.log('🌩️ 使用 Cloudflare Workers AI 生成图片')
      
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: prompt,
              num_steps: 4 // Schnell模型推荐4步
            })
          }
        )

        if (!response.ok) {
          throw new Error(`Cloudflare API error: ${response.status}`)
        }

        const result = await response.blob()
        const base64Image = await blobToBase64(result)

        console.log('✅ Cloudflare 图片生成成功')
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            image: base64Image,
            provider: 'cloudflare'
          })
        }
      } catch (error) {
        console.error('❌ Cloudflare 生成失败:', error)
        // 继续尝试其他服务
      }
    }

    // 备用方案1: Replicate (Flux Schnell)
    if (REPLICATE_API_TOKEN) {
      console.log('🔄 使用 Replicate API 生成图片')
      
      try {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            version: 'black-forest-labs/flux-schnell',
            input: {
              prompt: prompt,
              num_inference_steps: 4,
              guidance_scale: 0,
              output_format: 'jpg'
            }
          })
        })

        if (!response.ok) {
          throw new Error(`Replicate API error: ${response.status}`)
        }

        const prediction = await response.json()
        
        // 等待生成完成（最多30秒）
        let attempts = 0
        const maxAttempts = 30
        let finalPrediction = prediction

        while (finalPrediction.status !== 'succeeded' && finalPrediction.status !== 'failed' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const statusResponse = await fetch(
            `https://api.replicate.com/v1/predictions/${finalPrediction.id}`,
            {
              headers: {
                'Authorization': `Token ${REPLICATE_API_TOKEN}`
              }
            }
          )
          
          finalPrediction = await statusResponse.json()
          attempts++
        }

        if (finalPrediction.status === 'succeeded' && finalPrediction.output?.[0]) {
          // 下载图片并转为base64
          const imageResponse = await fetch(finalPrediction.output[0])
          const imageBlob = await imageResponse.blob()
          const base64Image = await blobToBase64(imageBlob)

          console.log('✅ Replicate 图片生成成功')
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              image: base64Image,
              provider: 'replicate'
            })
          }
        }
      } catch (error) {
        console.error('❌ Replicate 生成失败:', error)
        // 继续尝试其他服务
      }
    }

    // 备用方案2: 自定义 Flux API
    if (FLUX_API_URL) {
      console.log('🎯 使用自定义 Flux API 生成图片')
      
      try {
        const response = await fetch(FLUX_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt })
        })

        if (!response.ok) {
          throw new Error(`Flux API error: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.image) {
          console.log('✅ 自定义 Flux API 图片生成成功')
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              image: data.image,
              provider: 'custom'
            })
          }
        }
      } catch (error) {
        console.error('❌ 自定义 Flux API 生成失败:', error)
      }
    }

    // 所有方案都失败，返回占位图
    console.log('⚠️ 所有图片生成服务都不可用，使用占位图')
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        image: `https://picsum.photos/300/400?random=${Date.now()}`,
        provider: 'placeholder',
        message: '图片生成服务暂时不可用，已使用占位图'
      })
    }

  } catch (error) {
    console.error('❌ 图片生成错误:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        image: `https://picsum.photos/300/400?random=${Date.now()}` // 返回占位图避免前端报错
      })
    }
  }
}

// 辅助函数：将Blob转为base64
async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  return `data:${blob.type};base64,${base64}`
}

export { handler }
