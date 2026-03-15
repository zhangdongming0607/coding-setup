// Background Service Worker
// 处理与 Notion API 的通信

console.log('✅ Background Service Worker 已启动');
console.log('✅ Background Service Worker ID:', chrome.runtime.id);

// 确保 Service Worker 保持活跃
chrome.runtime.onConnect.addListener((port) => {
  console.log('🔵 Background: 收到连接', port.name);
  port.onDisconnect.addListener(() => {
    console.log('🔵 Background: 连接断开', port.name);
  });
});

// 从 Notion 同步标签列表
async function syncTagsFromNotion() {
  console.log('🔄 syncTagsFromNotion: 开始同步标签...');
  try {
    const config = await chrome.storage.sync.get(['notionApiKey', 'notionDatabaseId']);
    console.log('🔄 syncTagsFromNotion: 配置检查', {
      hasApiKey: !!config.notionApiKey,
      hasDatabaseId: !!config.notionDatabaseId
    });
    
    if (!config.notionApiKey || !config.notionDatabaseId) {
      console.log('⚠️ 未配置，无法同步标签');
      return { success: false, tags: [], error: '未配置 Notion API 密钥或数据库 ID' };
    }

    console.log('🔄 syncTagsFromNotion: 开始查询数据库...');
    // 查询数据库，获取标签属性的选项
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${config.notionDatabaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.notionApiKey}`,
        'Notion-Version': '2022-06-28'
      }
    });

    console.log('🔄 syncTagsFromNotion: 数据库查询响应状态', dbResponse.status);

    if (!dbResponse.ok) {
      const errorData = await dbResponse.json().catch(() => ({}));
      console.error('❌ 查询数据库失败:', dbResponse.status, errorData);
      return { 
        success: false, 
        tags: [], 
        error: `查询数据库失败: ${dbResponse.status} ${errorData.message || ''}` 
      };
    }

    const database = await dbResponse.json();
    const properties = database.properties;
    console.log('🔄 syncTagsFromNotion: 数据库属性列表', Object.keys(properties));
    
    // 查找标签属性（可能是"标签"、"Tags"、"tag"等）
    let tagProperty = null;
    const possibleNames = ['标签', 'Tags', 'tag', 'tags', 'Tag', '标签列表'];
    
    for (const name of possibleNames) {
      if (properties[name] && properties[name].type === 'multi_select') {
        tagProperty = properties[name];
        console.log(`✅ 找到标签属性: "${name}"`);
        break;
      }
    }
    
    // 如果没找到，尝试查找所有 multi_select 类型的属性
    if (!tagProperty) {
      for (const [propName, prop] of Object.entries(properties)) {
        if (prop.type === 'multi_select') {
          tagProperty = prop;
          console.log(`✅ 找到多选属性: "${propName}"，将用作标签属性`);
          break;
        }
      }
    }

    if (!tagProperty) {
      console.log('⚠️ 未找到标签属性（Multi-select类型），将使用空列表');
      // 缓存空列表
      await chrome.storage.local.set({
        tags: [],
        tagsLastSync: Date.now()
      });
      return { success: true, tags: [] };
    }

    // 提取标签选项
    const tags = tagProperty.multi_select?.options?.map(opt => opt.name) || [];
    
    console.log('📋 从 Notion 读取到的标签选项:', tagProperty.multi_select?.options);
    console.log('📋 提取的标签名称:', tags);
    
    // 缓存标签列表
    await chrome.storage.local.set({
      tags: tags,
      tagsLastSync: Date.now()
    });
    
    console.log('✅ 标签同步成功，共', tags.length, '个标签:', tags);
    return { success: true, tags: tags };
    
  } catch (error) {
    console.error('❌ 同步标签失败:', error);
    return { success: false, tags: [], error: error.message };
  }
}

// 获取数据库结构（带缓存）
let databaseCache = null;
let databaseCacheTime = 0;
const DATABASE_CACHE_DURATION = 5 * 60 * 1000; // 缓存5分钟

async function getDatabaseStructure(config) {
  const now = Date.now();
  
  // 如果缓存有效，直接返回
  if (databaseCache && (now - databaseCacheTime) < DATABASE_CACHE_DURATION) {
    console.log('📦 使用缓存的数据库结构');
    return databaseCache;
  }
  
  console.log('🔄 查询数据库结构...');
  try {
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${config.notionDatabaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.notionApiKey}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!dbResponse.ok) {
      console.warn('⚠️ 获取数据库结构失败:', dbResponse.status);
      return null;
    }

    const database = await dbResponse.json();
    
    // 缓存数据库结构
    databaseCache = database;
    databaseCacheTime = now;
    
    console.log('✅ 数据库结构已缓存');
    return database;
  } catch (error) {
    console.error('❌ 获取数据库结构异常:', error);
    return null;
  }
}

// 从数据库结构中提取属性名称
function extractPropertyNames(database) {
  if (!database || !database.properties) {
    return { tagPropertyName: null, urlPropertyName: null };
  }
  
  const properties = database.properties;
  let tagPropertyName = null;
  let urlPropertyName = null;
  
  // 查找标签属性
  const tagPossibleNames = ['标签', 'Tags', 'tag', 'tags', 'Tag', '标签列表'];
  for (const name of tagPossibleNames) {
    if (properties[name] && properties[name].type === 'multi_select') {
      tagPropertyName = name;
      break;
    }
  }
  if (!tagPropertyName) {
    for (const [propName, prop] of Object.entries(properties)) {
      if (prop.type === 'multi_select') {
        tagPropertyName = propName;
        break;
      }
    }
  }
  
  // 查找URL属性
  const urlPossibleNames = ['URL', 'url', 'Url', '链接', 'Link', 'link', '来源', 'Source', 'source'];
  for (const name of urlPossibleNames) {
    if (properties[name] && properties[name].type === 'url') {
      urlPropertyName = name;
      break;
    }
  }
  if (!urlPropertyName) {
    for (const [propName, prop] of Object.entries(properties)) {
      if (prop.type === 'url') {
        urlPropertyName = propName;
        break;
      }
    }
  }
  
  return { tagPropertyName, urlPropertyName };
}

// 查询是否存在相同URL的页面（使用已获取的URL属性名称）
async function findPageByUrl(config, url, urlPropertyName) {
  console.log('🔍 查询是否存在相同URL的页面:', url);
  
  if (!urlPropertyName) {
    console.warn('⚠️ 未找到URL属性，无法查询相同URL的页面');
    return null;
  }
  
  try {
    // 使用 Notion API 查询数据库
    const response = await fetch(`https://api.notion.com/v1/databases/${config.notionDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: {
          property: urlPropertyName,
          url: {
            equals: url
          }
        },
        page_size: 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('⚠️ 查询页面失败:', response.status, errorData);
      return null;
    }

    const result = await response.json();
    console.log('🔍 查询结果:', {
      hasResults: result.results && result.results.length > 0,
      resultCount: result.results?.length || 0
    });

    if (result.results && result.results.length > 0) {
      const page = result.results[0];
      console.log('✅ 找到相同URL的页面:', page.id);
      return page;
    }

    return null;
  } catch (error) {
    console.error('❌ 查询页面异常:', error);
    return null;
  }
}

// 创建评论到文本块
async function createBlockComment(config, blockId, comment) {
  if (!comment || !comment.trim()) {
    return { success: true };
  }
  
  console.log('💬 创建评论到文本块:', blockId);
  
  try {
    const response = await fetch('https://api.notion.com/v1/comments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: {
          block_id: blockId
        },
        rich_text: [
          {
            type: 'text',
            text: {
              content: comment.trim()
            }
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('⚠️ 创建评论失败:', response.status, errorData);
      throw new Error(errorData.message || '创建评论失败');
    }

    const result = await response.json();
    console.log('✅ 评论已创建到文本块:', result.id);
    return { success: true, commentId: result.id };
  } catch (error) {
    console.error('❌ 创建评论异常:', error);
    throw error;
  }
}

// 追加内容到现有页面（优化版：减少API调用）
async function appendToExistingPage(config, pageId, text, url, tagPropertyName, newTags, existingPageData = null, comment = null) {
  console.log('📝 追加内容到现有页面:', pageId);
  
  try {
    // 构建要追加的内容块
    const newBlocks = [
      {
        object: 'block',
        type: 'divider',
        divider: {}
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: text
              }
            }
          ]
        }
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              annotations: {
                italic: true,
                color: 'gray'
              },
              text: {
                content: `保存时间: ${new Date().toLocaleString('zh-CN')}`
              }
            }
          ]
        }
      }
    ];

    // 准备更新属性
    const updateProperties = {
      '收藏时间': {
        date: {
          start: new Date().toISOString()
        }
      }
    };

    // 如果存在标签属性且需要合并标签
    if (tagPropertyName && newTags && newTags.length > 0) {
      let existingTagNames = [];
      
      // 如果已有页面数据，直接使用；否则需要获取
      if (existingPageData) {
        const existingTags = existingPageData.properties[tagPropertyName]?.multi_select || [];
        existingTagNames = existingTags.map(t => t.name);
      } else {
        // 如果没有页面数据，需要获取（但这种情况应该很少）
        try {
          const pageResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${config.notionApiKey}`,
              'Notion-Version': '2022-06-28'
            }
          });

          if (pageResponse.ok) {
            const pageData = await pageResponse.json();
            const existingTags = pageData.properties[tagPropertyName]?.multi_select || [];
            existingTagNames = existingTags.map(t => t.name);
          }
        } catch (error) {
          console.warn('⚠️ 获取现有标签失败，使用新标签:', error);
        }
      }
      
      // 合并标签（去重）
      const mergedTags = [...new Set([...existingTagNames, ...newTags])];
      updateProperties[tagPropertyName] = {
        multi_select: mergedTags.map(tag => ({ name: tag }))
      };
      
      console.log('✅ 标签已合并:', {
        existing: existingTagNames,
        new: newTags,
        merged: mergedTags
      });
    }

    // 并行执行：追加内容和更新属性
    const [appendResponse, updateResponse] = await Promise.all([
      // 追加内容块
      fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          children: newBlocks
        })
      }),
      // 更新页面属性（如果有需要更新的属性）
      Object.keys(updateProperties).length > 0 ? fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          properties: updateProperties
        })
      }) : Promise.resolve({ ok: true }) // 如果没有需要更新的属性，直接返回成功
    ]);

    if (!appendResponse.ok) {
      const errorData = await appendResponse.json().catch(() => ({}));
      console.error('❌ 追加内容失败:', appendResponse.status, errorData);
      throw new Error(`追加内容失败: ${appendResponse.status} ${errorData.message || ''}`);
    }

    const appendResult = await appendResponse.json();
    console.log('✅ 内容已追加到页面');

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      console.warn('⚠️ 更新页面属性失败:', updateResponse.status, errorData);
      // 不抛出错误，因为内容已经追加成功了
    } else {
      console.log('✅ 页面属性已更新');
    }

    // 如果有评论，创建评论到文本块（完全异步，不阻塞响应）
    if (comment && comment.trim() && appendResult.results && appendResult.results.length > 1) {
      const textBlockId = appendResult.results[1].id; // 文本块是第二个（索引1）
      console.log('💬 后台创建评论到文本块:', textBlockId);
      
      // 完全异步执行，不等待
      createBlockComment(config, textBlockId, comment).catch(err => {
        console.warn('⚠️ 创建评论失败（非阻塞）:', err);
      });
    }

    return { success: true, pageId: pageId };
  } catch (error) {
    console.error('❌ 追加内容到页面异常:', error);
    throw error;
  }
}

// 保存到 Notion
async function saveToNotion(data) {
  console.log('🔵 Background: 收到保存请求', data);
  
  try {
    // 获取配置
    const config = await chrome.storage.sync.get(['notionApiKey', 'notionDatabaseId']);
    console.log('🔵 Background: 配置信息', {
      hasApiKey: !!config.notionApiKey,
      hasDatabaseId: !!config.notionDatabaseId,
      databaseId: config.notionDatabaseId?.substring(0, 10) + '...'
    });
    
    if (!config.notionApiKey || !config.notionDatabaseId) {
      console.error('❌ Background: 配置不完整');
      return {
        success: false,
        error: 'not_configured',
        message: '请先配置 Notion API 密钥和数据库 ID'
      };
    }

    const { text, url, title, tags = [], comment = '' } = data;
    console.log('🔵 Background: 准备调用 Notion API', {
      textLength: text?.length,
      url: url,
      title: title,
      tags: tags,
      hasComment: !!comment
    });

    // 一次性获取数据库结构（带缓存）
    const database = await getDatabaseStructure(config);
    if (!database) {
      return {
        success: false,
        error: 'database_error',
        message: '无法获取数据库结构'
      };
    }

    // 从数据库结构中提取属性名称
    const { tagPropertyName, urlPropertyName } = extractPropertyNames(database);
    
    if (tagPropertyName) {
      console.log(`✅ 找到标签属性: "${tagPropertyName}"`);
    } else {
      console.warn('⚠️ 未找到标签属性（Multi-select类型），标签功能将不可用');
    }
    
    if (urlPropertyName) {
      console.log(`✅ 找到URL属性: "${urlPropertyName}"`);
    } else {
      console.warn('⚠️ 未找到URL属性，将无法查询相同URL的页面');
    }

    // 查询是否存在相同URL的页面（使用已获取的URL属性名称）
    const existingPage = await findPageByUrl(config, url, urlPropertyName);
    
    if (existingPage) {
      // 如果存在相同URL的页面，追加内容到现有页面
      // 传递页面数据，避免再次查询
      console.log('✅ 找到相同URL的页面，将追加内容到现有页面');
      return await appendToExistingPage(config, existingPage.id, text, url, tagPropertyName, tags, existingPage, comment);
    }

    // 如果不存在，创建新页面
    console.log('📄 未找到相同URL的页面，创建新页面');

    // 构建标签数据（Multi-select格式）
    const tagOptions = tags && tags.length > 0 ? tags.map(tag => ({ name: tag })) : [];

    // 构建请求数据
    const requestData = {
      parent: {
        database_id: config.notionDatabaseId
      },
      properties: {
        '标题': {
          title: [
            {
              text: {
                content: title || '无标题'
              }
            }
          ]
        },
        'URL': {
          url: url
        },
        '收藏时间': {
          date: {
            start: new Date().toISOString()
          }
        }
      }
    };
    
    // 如果有标签且找到了标签属性，添加标签属性
    if (tagPropertyName && tagOptions.length > 0) {
      requestData.properties[tagPropertyName] = {
        multi_select: tagOptions
      };
      console.log(`✅ 添加标签属性 "${tagPropertyName}":`, tagOptions);
    } else if (tags && tags.length > 0 && !tagPropertyName) {
      console.warn('⚠️ 有标签但未找到标签属性，标签将被忽略');
    }
    
    // 添加children数组（只包含文本内容，URL已在properties中保存）
    requestData.children = [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: text
              }
            }
          ]
        }
      }
    ];
    
    console.log('🔵 Background: 发送的请求数据:', JSON.stringify(requestData, null, 2));

    // 调用 Notion API 创建页面
    console.log('🔵 Background: 开始调用 Notion API...');
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(requestData)
    });

    console.log('🔵 Background: Notion API 响应状态', response.status, response.statusText);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('❌ Background: Notion API 错误');
      console.error('❌ 错误详情:', JSON.stringify(errorData, null, 2));
      console.error('❌ 错误消息:', errorData.message);
      console.error('❌ 错误代码:', errorData.code);
      
      return {
        success: false,
        error: 'api_error',
        message: errorData.message || `API 错误: ${response.status} ${response.statusText}`
      };
    }

    const result = await response.json();
    console.log('✅ Background: 保存成功，页面 ID:', result.id);
    
    // 如果有评论，创建评论到文本块（完全异步，不阻塞响应）
    if (comment && comment.trim()) {
      // 完全异步执行，不等待
      (async () => {
        try {
          // 获取页面的子块
          const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${result.id}/children`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${config.notionApiKey}`,
              'Notion-Version': '2022-06-28'
            }
          });

          if (blocksResponse.ok) {
            const blocksResult = await blocksResponse.json();
            // 文本块是第一个块（索引0）
            if (blocksResult.results && blocksResult.results.length > 0) {
              const textBlockId = blocksResult.results[0].id;
              console.log('💬 后台创建评论到文本块:', textBlockId);
              
              // 创建评论（完全异步）
              await createBlockComment(config, textBlockId, comment);
            }
          }
        } catch (error) {
          console.warn('⚠️ 创建评论失败（非阻塞）:', error);
          // 不抛出错误，因为内容已经保存成功了
        }
      })(); // 立即执行，不等待
    }
    
    return {
      success: true,
      pageId: result.id
    };

  } catch (error) {
    console.error('❌ Background: 保存到 Notion 异常', error);
    console.error('❌ 错误堆栈:', error.stack);
    return {
      success: false,
      error: 'network_error',
      message: error.message || '未知错误'
    };
  }
}

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🔵 ========== Background: 收到消息 ==========');
  console.log('🔵 请求内容:', request);
  console.log('🔵 发送者:', sender);
  
  if (request.action === 'saveToNotion') {
    console.log('🔵 开始处理保存请求...');
    
    // 使用 async/await 确保响应总是被发送
    (async () => {
      try {
        const response = await saveToNotion(request.data);
        console.log('🔵 Background: 保存完成，返回响应:', response);
        
        // 如果保存成功且有新标签，同步标签列表（不阻塞响应）
        if (response.success && request.data.tags && request.data.tags.length > 0) {
          console.log('🔄 保存成功，同步标签列表...');
          syncTagsFromNotion().catch(err => {
            console.warn('⚠️ 后台同步标签失败:', err);
          });
        }
        
        sendResponse(response);
      } catch (error) {
        console.error('🔵 Background: 保存出错:', error);
        console.error('🔵 Background: 错误堆栈:', error.stack);
        sendResponse({ 
          success: false, 
          error: 'unknown_error',
          message: error.message || '未知错误' 
        });
      }
    })();
    
    // 返回 true 表示异步响应
    return true;
  } else if (request.action === 'ping') {
    // 简单的 ping 响应，用于检查 Service Worker 是否运行
    console.log('🔵 Background: 收到 ping，立即响应');
    sendResponse({ success: true, message: 'pong' });
    return true;
  } else if (request.action === 'syncTags') {
    console.log('🔵 ========== Background: 收到 syncTags 请求 ==========');
    console.log('🔵 Background: 开始同步标签...');
    
    // 使用 async/await 确保响应总是被发送
    (async () => {
      try {
        console.log('🔵 Background: 调用 syncTagsFromNotion...');
        const response = await syncTagsFromNotion();
        console.log('🔵 Background: 标签同步完成，返回响应:', response);
        console.log('🔵 Background: 准备发送响应...');
        sendResponse(response);
        console.log('🔵 Background: 响应已发送');
      } catch (error) {
        console.error('🔵 Background: 标签同步出错:', error);
        console.error('🔵 Background: 错误堆栈:', error.stack);
        const errorResponse = { 
          success: false, 
          tags: [], 
          error: error.message || '未知错误' 
        };
        console.log('🔵 Background: 发送错误响应:', errorResponse);
        sendResponse(errorResponse);
      }
    })();
    
    // 返回 true 表示异步响应
    return true;
  } else {
    console.log('🔵 Background: 未知的 action:', request.action);
    // 对于未知的 action，也要响应，避免消息挂起
    sendResponse({ 
      success: false, 
      error: 'unknown_action',
      message: `未知的 action: ${request.action}` 
    });
    return true;
  }
});

// 安装时打开选项页面
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
  // 安装或更新时，尝试同步标签
  syncTagsFromNotion().catch(error => {
    console.warn('⚠️ 启动时同步标签失败:', error);
  });
});

// Service Worker 启动时也尝试同步标签
syncTagsFromNotion().catch(error => {
  console.warn('⚠️ 启动时同步标签失败:', error);
});

// 调试函数：查询数据库属性（在 Service Worker 控制台中运行）
async function debugDatabaseProperties() {
  try {
    const config = await chrome.storage.sync.get(['notionApiKey', 'notionDatabaseId']);
    
    if (!config.notionApiKey || !config.notionDatabaseId) {
      console.error('❌ 请先配置 API 密钥和数据库 ID');
      return;
    }
    
    console.log('🔍 开始查询数据库属性...');
    console.log('📋 数据库 ID:', config.notionDatabaseId);
    
    const response = await fetch(`https://api.notion.com/v1/databases/${config.notionDatabaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.notionApiKey}`,
        'Notion-Version': '2022-06-28'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ 查询失败:', error);
      return;
    }
    
    const database = await response.json();
    const properties = database.properties;
    const propertyNames = Object.keys(properties);
    
    console.log('✅ 数据库查询成功');
    console.log('📊 数据库标题:', database.title?.[0]?.plain_text || '未知');
    console.log('\n📋 数据库属性列表:');
    console.log('属性总数:', propertyNames.length);
    
    propertyNames.forEach((propName, index) => {
      const prop = properties[propName];
      console.log(`${index + 1}. "${propName}" (类型: ${prop.type})`);
    });
    
    console.log('\n🔍 检查代码中使用的属性:');
    const expectedProps = ['标题', 'URL', '收藏时间'];
    expectedProps.forEach(expectedProp => {
      const exists = propertyNames.includes(expectedProp);
      const prop = properties[expectedProp];
      if (exists) {
        console.log(`✅ "${expectedProp}" 存在，类型: ${prop?.type}`);
      } else {
        console.log(`❌ "${expectedProp}" 不存在`);
        // 查找相似的属性名
        const similar = propertyNames.filter(name => 
          name.toLowerCase().includes(expectedProp.toLowerCase()) || 
          expectedProp.toLowerCase().includes(name.toLowerCase())
        );
        if (similar.length > 0) {
          console.log(`   可能的匹配:`, similar);
        }
      }
    });
    
    console.log('\n📝 提示：如果属性名称不匹配，请修改 background.js 中的属性名称');
    
  } catch (error) {
    console.error('❌ 查询异常:', error);
  }
}

// 调试函数：测试创建页面（在 Service Worker 控制台中运行）
async function testCreatePage() {
  try {
    const config = await chrome.storage.sync.get(['notionApiKey', 'notionDatabaseId']);
    
    if (!config.notionApiKey || !config.notionDatabaseId) {
      console.error('❌ 请先配置 API 密钥和数据库 ID');
      return;
    }
    
    console.log('🧪 测试创建页面...');
    
    const testData = {
      parent: {
        database_id: config.notionDatabaseId
      },
      properties: {
        '标题': {
          title: [
            {
              text: {
                content: '测试页面'
              }
            }
          ]
        },
        'URL': {
          url: 'https://example.com'
        },
        '收藏时间': {
          date: {
            start: new Date().toISOString()
          }
        }
      }
    };
    
    console.log('📤 发送的请求数据:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 响应状态:', response.status, response.statusText);
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ 测试创建成功！页面 ID:', result.id);
      console.log('✅ 创建的结果:', result);
    } else {
      console.error('❌ 测试创建失败');
      console.error('❌ 错误详情:', JSON.stringify(result, null, 2));
      console.error('❌ 错误消息:', result.message);
    }
    
  } catch (error) {
    console.error('❌ 测试异常:', error);
  }
}

// 将调试函数暴露到全局作用域，方便在控制台调用
self.debugDatabaseProperties = debugDatabaseProperties;
self.testCreatePage = testCreatePage;
console.log('💡 提示：在控制台运行以下函数可以调试：');
console.log('  - debugDatabaseProperties() - 查看数据库属性');
console.log('  - testCreatePage() - 测试创建页面');

