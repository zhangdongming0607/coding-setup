// Popup 脚本

async function checkConfiguration() {
  const config = await chrome.storage.sync.get(['notionApiKey', 'notionDatabaseId']);
  const statusDiv = document.getElementById('status');
  const openOptionsBtn = document.getElementById('openOptions');
  const debugSection = document.getElementById('debugSection');
  
  console.log('🔍 Popup: 检查配置', {
    hasApiKey: !!config.notionApiKey,
    hasDatabaseId: !!config.notionDatabaseId,
    debugSection: !!debugSection
  });
  
  if (config.notionApiKey && config.notionDatabaseId) {
    statusDiv.className = 'status configured';
    statusDiv.textContent = '✓ 已配置，可以开始使用';
    openOptionsBtn.textContent = '修改配置';
    // 显示调试区域
    if (debugSection) {
      debugSection.style.display = 'block';
      console.log('✅ Popup: 显示调试区域');
    } else {
      console.error('❌ Popup: 找不到调试区域元素');
    }
    // 加载标签信息
    loadTagsInfo();
  } else {
    statusDiv.className = 'status not-configured';
    statusDiv.textContent = '✗ 未配置，请先设置 Notion API 密钥';
    openOptionsBtn.textContent = '配置插件';
    if (debugSection) {
      debugSection.style.display = 'none';
    }
  }
}

// 加载标签信息
async function loadTagsInfo() {
  const tagsListDiv = document.getElementById('tagsList');
  if (!tagsListDiv) return;
  
  try {
    // 从缓存读取标签
    const cached = await chrome.storage.local.get(['tags', 'tagsLastSync']);
    const tags = cached.tags || [];
    const lastSync = cached.tagsLastSync;
    
    if (tags.length === 0) {
      tagsListDiv.innerHTML = '<div style="color: #6b7280;">暂无标签（点击"同步标签"从 Notion 加载）</div>';
    } else {
      const syncTime = lastSync ? new Date(lastSync).toLocaleString('zh-CN') : '未知';
      tagsListDiv.innerHTML = `
        <div style="margin-bottom: 8px;">
          <strong>标签数量：</strong>${tags.length} 个
        </div>
        <div style="margin-bottom: 8px;">
          <strong>最后同步：</strong>${syncTime}
        </div>
        <div>
          <strong>标签列表：</strong>
          <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px;">
            ${tags.map(tag => `<span style="padding: 2px 8px; background: #e5e7eb; border-radius: 4px; font-size: 11px;">${tag}</span>`).join('')}
          </div>
        </div>
      `;
    }
  } catch (error) {
    tagsListDiv.innerHTML = `<div style="color: #ef4444;">加载失败: ${error.message}</div>`;
  }
}

// 同步标签
async function syncTags() {
  const syncBtn = document.getElementById('syncTagsBtn');
  const tagsListDiv = document.getElementById('tagsList');
  
  if (!syncBtn || !tagsListDiv) {
    console.error('❌ 找不到同步按钮或标签信息区域');
    return;
  }
  
  const originalText = syncBtn.textContent;
  syncBtn.disabled = true;
  syncBtn.textContent = '同步中...';
  tagsListDiv.innerHTML = '<div style="color: #6b7280;">正在从 Notion 同步标签...</div>';
  
  try {
    // 检查 runtime 是否可用
    if (!chrome.runtime || !chrome.runtime.id) {
      throw new Error('Extension context invalidated - 请刷新页面');
    }
    
    console.log('📤 Popup: 发送同步标签请求...');
    
    // 发送同步请求（添加超时）
    const response = await Promise.race([
      chrome.runtime.sendMessage({ action: 'syncTags' }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('同步超时（15秒）')), 15000)
      )
    ]);
    
    console.log('📥 Popup: 收到响应:', response);
    
    if (response && response.success) {
      tagsListDiv.innerHTML = `<div style="color: #10b981; margin-bottom: 8px;">✓ 同步成功！共 ${response.tags?.length || 0} 个标签</div>`;
      // 重新加载标签信息
      setTimeout(() => {
        loadTagsInfo();
      }, 500);
    } else {
      const errorMsg = response?.error || response?.message || '未知错误';
      tagsListDiv.innerHTML = `<div style="color: #ef4444;">同步失败: ${errorMsg}</div>`;
      console.error('❌ 同步失败:', response);
    }
  } catch (error) {
    const errorMsg = error.message || error.toString();
    console.error('❌ 同步标签异常:', error);
    
    if (errorMsg.includes('Extension context invalidated') || errorMsg.includes('message port closed')) {
      tagsListDiv.innerHTML = `<div style="color: #ef4444;">扩展上下文已失效，请刷新页面后重试</div>`;
    } else if (errorMsg.includes('超时')) {
      tagsListDiv.innerHTML = `<div style="color: #ef4444;">同步超时，请检查网络连接或稍后重试</div>`;
    } else {
      tagsListDiv.innerHTML = `<div style="color: #ef4444;">同步失败: ${errorMsg}</div>`;
    }
  } finally {
    syncBtn.disabled = false;
    syncBtn.textContent = originalText;
  }
}

document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// 测试 Service Worker
async function testServiceWorker() {
  const testBtn = document.getElementById('testPingBtn');
  const testResult = document.getElementById('testResult');
  const testResultContent = document.getElementById('testResultContent');
  
  if (!testBtn || !testResult || !testResultContent) return;
  
  const originalText = testBtn.textContent;
  testBtn.disabled = true;
  testBtn.textContent = '测试中...';
  testResult.style.display = 'block';
  testResultContent.innerHTML = '<div style="color: #6b7280;">正在测试 Service Worker...</div>';
  
  try {
    // 检查 runtime 是否可用
    if (!chrome.runtime || !chrome.runtime.id) {
      throw new Error('chrome.runtime 不可用');
    }
    
    console.log('🧪 Popup: 发送 ping 请求...');
    const response = await Promise.race([
      chrome.runtime.sendMessage({ action: 'ping' }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('ping 超时（5秒）')), 5000)
      )
    ]);
    
    console.log('🧪 Popup: 收到 ping 响应:', response);
    
    if (response && response.success) {
      testResultContent.innerHTML = `
        <div style="color: #10b981; margin-bottom: 4px;">✓ Service Worker 正在运行</div>
        <div style="color: #6b7280; font-size: 10px;">响应: ${JSON.stringify(response)}</div>
        <div style="color: #6b7280; font-size: 10px; margin-top: 4px;">Runtime ID: ${chrome.runtime.id}</div>
      `;
    } else {
      testResultContent.innerHTML = `
        <div style="color: #ef4444;">✗ Service Worker 响应异常</div>
        <div style="color: #6b7280; font-size: 10px;">响应: ${JSON.stringify(response)}</div>
      `;
    }
  } catch (error) {
    const errorMsg = error.message || error.toString();
    console.error('❌ 测试 Service Worker 失败:', error);
    
    if (errorMsg.includes('Extension context invalidated') || errorMsg.includes('message port closed')) {
      testResultContent.innerHTML = `
        <div style="color: #ef4444;">✗ Extension context invalidated</div>
        <div style="color: #6b7280; font-size: 10px;">请刷新页面或重新加载扩展</div>
      `;
    } else if (errorMsg.includes('超时')) {
      testResultContent.innerHTML = `
        <div style="color: #ef4444;">✗ Service Worker 无响应（超时）</div>
        <div style="color: #6b7280; font-size: 10px;">可能原因：</div>
        <div style="color: #6b7280; font-size: 10px; margin-left: 8px;">1. Service Worker 未运行</div>
        <div style="color: #6b7280; font-size: 10px; margin-left: 8px;">2. 扩展未正确加载</div>
        <div style="color: #6b7280; font-size: 10px; margin-left: 8px;">3. 请尝试重新加载扩展</div>
      `;
    } else {
      testResultContent.innerHTML = `
        <div style="color: #ef4444;">✗ 测试失败: ${errorMsg}</div>
      `;
    }
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = originalText;
  }
}

// 绑定按钮事件
const syncTagsBtn = document.getElementById('syncTagsBtn');
if (syncTagsBtn) {
  syncTagsBtn.addEventListener('click', syncTags);
}

const testPingBtn = document.getElementById('testPingBtn');
if (testPingBtn) {
  testPingBtn.addEventListener('click', testServiceWorker);
}

// 页面加载时检查配置
checkConfiguration();

