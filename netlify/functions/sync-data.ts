import { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

interface SyncRequest {
  userId: string;
  action: 'backup' | 'restore';
  data?: {
    messages?: any[];
    contacts?: any[];
    moments?: any[];
    memories?: any[];
    settings?: any;
  };
}

export const handler: Handler = async (event: HandlerEvent) => {
  // 处理 CORS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // 初始化 Supabase 客户端
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database not configured' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // GET 请求：恢复数据
    if (event.httpMethod === 'GET') {
      const userId = event.queryStringParameters?.userId;
      
      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'userId is required' })
        };
      }

      // 从数据库获取用户数据
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Supabase error:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to restore data', details: error.message })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          data: data?.data || null,
          lastBackup: data?.updated_at || null
        })
      };
    }

    // POST 请求：备份数据
    const body: SyncRequest = JSON.parse(event.body || '{}');
    const { userId, action, data: userData } = body;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    if (action === 'backup') {
      if (!userData) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'data is required for backup' })
        };
      }

      // 保存到数据库（upsert：存在则更新，不存在则插入）
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          data: userData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Supabase error:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to backup data', details: error.message })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          message: 'Data backed up successfully',
          timestamp: new Date().toISOString()
        })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid action' })
    };

  } catch (error) {
    console.error('Sync function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
