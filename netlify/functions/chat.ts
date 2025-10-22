import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface ChatRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
  userId?: string;
  enableWebSearch?: boolean;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body: ChatRequest = JSON.parse(event.body || '{}');
    const { messages, enableWebSearch = true } = body;

    if (!messages || messages.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Messages are required' })
      };
    }

    // 从环境变量获取 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API Key not configured' })
      };
    }

    // 调用 DeepSeek API（支持联网搜索）
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        // 启用联网搜索
        web_search: enableWebSearch,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'DeepSeek API call failed', details: errorData })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Chat function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
