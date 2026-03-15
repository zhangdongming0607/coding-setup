// Options 页面脚本

const form = document.getElementById('configForm');
const apiKeyInput = document.getElementById('notionApiKey');
const databaseIdInput = document.getElementById('notionDatabaseId');
const saveBtn = document.getElementById('saveBtn');
const testBtn = document.getElementById('testBtn');
const messageDiv = document.getElementById('message');

// 加载已保存的配置
async function loadConfig() {
  const config = await chrome.storage.sync.get(['notionApiKey', 'notionDatabaseId']);
  if (config.notionApiKey) {
    apiKeyInput.value = config.notionApiKey;
  }
  if (config.notionDatabaseId) {
    databaseIdInput.value = config.notionDatabaseId;
  }
}

// 自动清理数据库 ID 输入（当失去焦点时）
function setupAutoClean() {
  databaseIdInput.addEventListener('blur', () => {
    const originalValue = databaseIdInput.value.trim();
    if (!originalValue) return;
    
    const cleaned = cleanDatabaseId(originalValue);
    
    // 如果清理后的值不同，更新输入框并显示提示
    if (cleaned !== originalValue && cleaned.length === 32) {
      databaseIdInput.value = cleaned;
      showMessage('✓ 已自动提取数据库 ID', 'success');
    } else if (cleaned !== originalValue && cleaned.length > 0 && cleaned.length !== 32) {
      // 如果提取了但不完整，保留原值但提示用户
      showMessage(`⚠️ 提取到 ${cleaned.length} 个字符，数据库 ID 应该是 32 个字符`, 'error');
    }
  });
  
  // 粘贴时也自动清理
  databaseIdInput.addEventListener('paste', (e) => {
    setTimeout(() => {
      const pastedValue = databaseIdInput.value.trim();
      if (pastedValue && pastedValue.includes('notion.so')) {
        const cleaned = cleanDatabaseId(pastedValue);
        if (cleaned.length === 32) {
          databaseIdInput.value = cleaned;
          showMessage('✓ 已自动提取数据库 ID', 'success');
        }
      }
    }, 10);
  });
}

// 显示消息
function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  setTimeout(() => {
    messageDiv.className = 'message';
  }, 5000);
}

// 清理数据库 ID（去除 URL 中的参数和路径）
function cleanDatabaseId(input) {
  let cleaned = input.trim();
  
  if (!cleaned) {
    return '';
  }
  
  // 如果是完整的 URL，提取数据库 ID
  if (cleaned.includes('notion.so/')) {
    // 匹配多种 URL 格式：
    // 1. https://www.notion.so/workspace/database-id?v=...
    // 2. https://www.notion.so/database-id?v=...
    // 3. notion.so/workspace/database-id
    // 提取最后一个斜杠和问号之间的 32 位十六进制字符
    const patterns = [
      /notion\.so\/[^\/]+\/([a-f0-9]{32})(?:\?|$|#)/i,  // 有 workspace 的情况
      /notion\.so\/([a-f0-9]{32})(?:\?|$|#)/i,           // 直接是数据库 ID
      /\/([a-f0-9]{32})(?:\?|$|#)/i                      // 通用匹配
    ];
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        cleaned = match[1];
        break;
      }
    }
  }
  
  // 去除 ?v= 等查询参数后的部分（如果还没提取）
  cleaned = cleaned.split('?')[0];
  cleaned = cleaned.split('&')[0];
  cleaned = cleaned.split('#')[0];
  
  // 去除路径部分（如果还有路径）
  const lastSlashIndex = cleaned.lastIndexOf('/');
  if (lastSlashIndex >= 0) {
    const afterSlash = cleaned.substring(lastSlashIndex + 1);
    // 如果斜杠后是 32 位十六进制字符，使用它
    if (/^[a-f0-9]{32}$/i.test(afterSlash)) {
      cleaned = afterSlash;
    }
  }
  
  // 只保留字母和数字（数据库 ID 应该是 32 个字符的十六进制）
  cleaned = cleaned.replace(/[^a-f0-9]/gi, '');
  
  return cleaned;
}

// 测试 Notion 连接
async function testConnection() {
  const apiKey = apiKeyInput.value.trim();
  let databaseId = cleanDatabaseId(databaseIdInput.value);
  
  if (!apiKey || !databaseId) {
    showMessage('请先填写 API 密钥和数据库 ID', 'error');
    return;
  }
  
  // 验证数据库 ID 格式
  if (databaseId.length !== 32) {
    showMessage(`数据库 ID 应该是 32 个字符，当前是 ${databaseId.length} 个字符。请从 URL 中复制正确的 ID（位于 / 和 ? 之间的部分）`, 'error');
    databaseIdInput.focus();
    return;
  }
  
  testBtn.disabled = true;
  testBtn.textContent = '测试中...';
  
  try {
    // 测试查询数据库
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28'
      }
    });
    
    if (response.ok) {
      showMessage('✓ 连接成功！可以保存配置了', 'success');
    } else {
      const error = await response.json();
      showMessage(`连接失败：${error.message || '请检查 API 密钥和数据库 ID'}`, 'error');
    }
  } catch (error) {
    showMessage(`连接失败：${error.message}`, 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = '测试连接';
  }
}

// 保存配置
async function saveConfig(e) {
  e.preventDefault();
  
  const apiKey = apiKeyInput.value.trim();
  let databaseId = cleanDatabaseId(databaseIdInput.value);
  
  // 验证数据库 ID 格式
  if (databaseId.length !== 32) {
    showMessage(`数据库 ID 应该是 32 个字符，当前是 ${databaseId.length} 个字符。请从 URL 中复制正确的 ID（位于 / 和 ? 之间的部分）`, 'error');
    databaseIdInput.focus();
    return;
  }
  
  if (!apiKey || !databaseId) {
    showMessage('请填写所有必填项', 'error');
    return;
  }
  
  saveBtn.disabled = true;
  saveBtn.textContent = '保存中...';
  
  // 保存清理后的数据库 ID
  try {
    await chrome.storage.sync.set({
      notionApiKey: apiKey,
      notionDatabaseId: databaseId
    });
    
    showMessage('✓ 配置已保存！', 'success');
    
    // 延迟后恢复按钮
    setTimeout(() => {
      saveBtn.disabled = false;
      saveBtn.textContent = '保存配置';
    }, 1000);
  } catch (error) {
    showMessage(`保存失败：${error.message}`, 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = '保存配置';
  }
}

// 绑定事件
form.addEventListener('submit', saveConfig);
testBtn.addEventListener('click', testConnection);

// 页面加载时加载配置和设置自动清理
loadConfig();
setupAutoClean();

