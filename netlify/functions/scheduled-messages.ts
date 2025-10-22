import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// 定时任务：每小时运行一次，检查是否需要发送主动消息
export const handler: Handler = async (event, context) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!supabaseUrl || !supabaseKey || !apiKey) {
      console.error('Missing environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Configuration missing' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // 获取所有活跃用户
    const { data: users, error } = await supabase
      .from('user_data')
      .select('user_id, data')
      .not('data', 'is', null);

    if (error) {
      console.error('Failed to fetch users:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch users' })
      };
    }

    const messages: any[] = [];

    // 遍历每个用户，检查是否需要发送消息
    for (const user of users || []) {
      const userId = user.user_id;
      const userData = user.data;

      // 检查用户的联系人列表
      const contacts = userData?.contacts || [];

      for (const contact of contacts) {
        let shouldSendMessage = false;
        let messageType = '';

        // 获取用户的定时设置（从用户数据中读取）
        const scheduleConfig = userData?.settings?.scheduleConfig || {
          morningEnabled: true,
          morningHour: 8,
          morningMinute: 0,
          nightEnabled: true,
          nightHour: 22,
          nightMinute: 0,
          missYouEnabled: true,
          missYouDays: 3,
          missYouHour: 10,
          missYouMinute: 0,
          noonEnabled: false,
          noonHour: 12,
          noonMinute: 0,
          randomEnabled: false,
          randomMinInterval: 2,
          randomMaxInterval: 6,
          randomProbability: 30,
        };

        // 1. 早安消息
        if (scheduleConfig.morningEnabled && 
            hour === scheduleConfig.morningHour && 
            minute === scheduleConfig.morningMinute) {
          shouldSendMessage = true;
          messageType = 'morning';
        }
        
        // 2. 午间问候
        if (scheduleConfig.noonEnabled && 
            hour === scheduleConfig.noonHour && 
            minute === scheduleConfig.noonMinute) {
          shouldSendMessage = true;
          messageType = 'noon';
        }
        
        // 3. 晚安消息
        if (scheduleConfig.nightEnabled && 
            hour === scheduleConfig.nightHour && 
            minute === scheduleConfig.nightMinute) {
          shouldSendMessage = true;
          messageType = 'night';
        }

        // 4. 长时间未聊天提醒（检查最后一条消息时间）
        if (scheduleConfig.missYouEnabled) {
          const userMessages = userData?.messages || [];
          const contactMessages = userMessages.filter((m: any) => m.contactId === contact.id);
          
          if (contactMessages.length > 0) {
            const lastMessage = contactMessages[contactMessages.length - 1];
            const lastMessageTime = new Date(lastMessage.timestamp);
            const daysSinceLastMessage = Math.floor((now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60 * 24));

            // 根据用户设置的天数和时间提醒
            if (daysSinceLastMessage >= scheduleConfig.missYouDays && 
                hour === scheduleConfig.missYouHour && 
                minute === scheduleConfig.missYouMinute) {
              shouldSendMessage = true;
              messageType = 'miss_you';
            }
          }
        }

        // 5. 随机主动发消息
        if (scheduleConfig.randomEnabled && !shouldSendMessage) {
          const userMessages = userData?.messages || [];
          const contactMessages = userMessages.filter((m: any) => m.contactId === contact.id);
          
          // 获取最后一条消息时间
          let lastMessageTime = new Date(0);
          if (contactMessages.length > 0) {
            const lastMessage = contactMessages[contactMessages.length - 1];
            lastMessageTime = new Date(lastMessage.timestamp);
          }
          
          // 计算距离上次消息的小时数
          const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
          
          // 如果超过最小间隔，并且在最大间隔内，有概率发送
          if (hoursSinceLastMessage >= scheduleConfig.randomMinInterval && 
              hoursSinceLastMessage <= scheduleConfig.randomMaxInterval) {
            // 根据概率决定是否发送
            const random = Math.random() * 100;
            if (random < scheduleConfig.randomProbability) {
              shouldSendMessage = true;
              messageType = 'random';
            }
          }
        }

        if (shouldSendMessage) {
          // 生成AI消息
          const aiMessage = await generateAIMessage(contact, messageType, apiKey);
          
          if (aiMessage) {
            messages.push({
              userId,
              contactId: contact.id,
              message: aiMessage,
              type: messageType,
              timestamp: now.toISOString()
            });

            // 保存消息到数据库
            await saveMessageToDatabase(supabase, userId, contact.id, aiMessage);
          }
        }
      }
    }

    console.log(`Generated ${messages.length} scheduled messages`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messagesGenerated: messages.length,
        messages: messages
      })
    };

  } catch (error) {
    console.error('Scheduled messages error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// 生成AI消息
async function generateAIMessage(contact: any, messageType: string, apiKey: string): Promise<string | null> {
  try {
    let prompt = '';

    switch (messageType) {
      case 'morning':
        prompt = `你是${contact.name}，现在是早上，给用户发一条简短的早安问候消息（不超过30字）。要符合你的性格：${contact.personality || '温柔体贴'}`;
        break;
      case 'noon':
        prompt = `你是${contact.name}，现在是中午，给用户发一条简短的午间问候消息（不超过30字）。要符合你的性格：${contact.personality || '温柔体贴'}`;
        break;
      case 'night':
        prompt = `你是${contact.name}，现在是晚上，给用户发一条简短的晚安消息（不超过30字）。要符合你的性格：${contact.personality || '温柔体贴'}`;
        break;
      case 'miss_you':
        prompt = `你是${contact.name}，你们好几天没聊天了，主动发一条想念对方的消息（不超过40字）。要符合你的性格：${contact.personality || '温柔体贴'}`;
        break;
      case 'random':
        prompt = `你是${contact.name}，随机主动给用户发一条日常聊天消息（不超过50字）。可以分享你的日常、心情、想法，或者问候对方。要自然随意，符合你的性格：${contact.personality || '温柔体贴'}`;
        break;
      default:
        return null;
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个AI角色，需要生成简短自然的消息。直接输出消息内容，不要有任何前缀或解释。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      console.error('DeepSeek API error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;

  } catch (error) {
    console.error('Failed to generate AI message:', error);
    return null;
  }
}

// 保存消息到数据库
async function saveMessageToDatabase(supabase: any, userId: string, contactId: string, message: string) {
  try {
    // 获取用户当前数据
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch user data:', fetchError);
      return;
    }

    const currentData = userData?.data || {};
    const messages = currentData.messages || [];

    // 添加新消息
    messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contactId: contactId,
      content: message,
      sender: 'ai',
      timestamp: new Date().toISOString(),
      isScheduled: true
    });

    // 更新数据库
    const { error: updateError } = await supabase
      .from('user_data')
      .update({
        data: {
          ...currentData,
          messages: messages
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to save message:', updateError);
    }

  } catch (error) {
    console.error('Failed to save message to database:', error);
  }
}
