// 划词收藏插件的 Content Script
// 处理文本选择和浮层面板显示

console.log('✅ 划词收藏插件 Content Script 已加载');

let floatingPanel = null;
let selectedText = '';
let selectionRange = null;
let selectedTags = []; // 选中的标签列表
let selectedTagsSet = new Set(); // 选中的标签集合（用于新UI）

// 获取选中的标签
function getSelectedTags() {
  const tags = Array.from(selectedTagsSet);
  
  // 获取新输入的标签（如果还没添加到 selectedTagsSet）
  const newTagInput = floatingPanel?.querySelector('#new-tag-input');
  const newTagValue = newTagInput?.value?.trim();
  if (newTagValue && !selectedTagsSet.has(newTagValue)) {
    tags.push(newTagValue);
  }
  
  return [...new Set(tags.filter(t => t))]; // 去重并过滤空值
}

// 保存到 Notion（函数定义移到前面，确保在事件绑定之前可用）
async function handleSaveToNotion() {
  console.log('💾 ========== handleSaveToNotion 函数被调用了 ==========');
  console.log('💾 当前 selectedText 变量:', selectedText);
  console.log('💾 window.selectedText:', window.selectedText);
  
  // 如果全局变量为空，尝试使用 window.selectedText
  const textToSave = selectedText || window.selectedText;
  
  console.log('💾 要保存的文本:', textToSave);
  
  if (!textToSave) {
    console.error('❌ 没有选中的文本');
    alert('没有选中的文本，请先选中文本');
    return;
  }
  
  // 获取选中的标签
  selectedTags = getSelectedTags();
  console.log('💾 选中的标签:', selectedTags);
  
  // 获取评论内容
  const commentInput = document.getElementById('comment-input');
  const comment = commentInput ? commentInput.value.trim() : '';
  console.log('💾 评论内容:', comment);

  try {
    // 显示加载状态
    const saveBtn = document.getElementById('save-to-notion');
    if (!saveBtn) {
      console.error('❌ 无法找到保存按钮');
      return;
    }
    
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '保存中...';
    saveBtn.disabled = true;

    // 获取当前页面信息
    const pageTitle = document.title;
    const pageUrl = window.location.href;
    
    console.log('📤 准备发送数据:', {
      textLength: textToSave.length,
      text: textToSave.substring(0, 50) + '...',
      url: pageUrl,
      title: pageTitle
    });
    
    // 检查 chrome.runtime 是否可用
    console.log('🔍 检查 chrome 对象:', typeof chrome);
    console.log('🔍 chrome.runtime:', chrome?.runtime);
    console.log('🔍 chrome.runtime?.id:', chrome?.runtime?.id);
    
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      console.error('❌ chrome.runtime.sendMessage 不可用');
      saveBtn.innerHTML = '✗ 扩展 API 不可用';
      saveBtn.style.backgroundColor = '#ef4444';
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        saveBtn.style.backgroundColor = '';
      }, 3000);
      alert('无法访问扩展 API。\n\n请尝试：\n1. 重新加载扩展（chrome://extensions/）\n2. 刷新当前页面\n3. 在其他网页上测试');
      return;
    }
    
    // 检查 Extension context 是否有效
    try {
      const runtimeId = chrome.runtime.id;
      if (!runtimeId) {
        throw new Error('Extension context invalidated');
      }
      console.log('✅ chrome.runtime.sendMessage 可用，ID:', runtimeId);
    } catch (error) {
      console.error('❌ Extension context invalidated');
      saveBtn.innerHTML = '✗ 扩展已失效';
      saveBtn.style.backgroundColor = '#ef4444';
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        saveBtn.style.backgroundColor = '';
      }, 3000);
      alert('扩展上下文已失效。\n\n请：\n1. 刷新当前页面（F5 或 Cmd+R）\n2. 如果问题持续，请重新加载扩展');
      return;
    }
    
    console.log('📤 正在发送消息到 Background Script...');
    console.log('📤 发送的数据:', {
      action: 'saveToNotion',
      data: {
        textLength: textToSave.length,
        url: pageUrl,
        title: pageTitle
      }
    });

    // 发送消息到 background script（添加超时处理）
    let response;
    try {
      console.log('📤 Content: 准备发送消息，runtime.id:', chrome.runtime.id);
      
      // 先尝试 ping background script，确保它正在运行
      try {
        const pingResponse = await Promise.race([
          chrome.runtime.sendMessage({ action: 'ping' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('ping 超时')), 2000))
        ]);
        console.log('📤 Content: ping 响应:', pingResponse);
      } catch (pingError) {
        console.warn('⚠️ Content: ping 失败，但继续尝试发送保存请求:', pingError.message);
      }
      
      response = await Promise.race([
        chrome.runtime.sendMessage({
          action: 'saveToNotion',
          data: {
            text: textToSave,
            url: pageUrl,
            title: pageTitle,
            tags: selectedTags,
            comment: comment
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('保存请求超时（30秒）')), 30000)
        )
      ]);
      console.log('📥 ========== 收到响应 ==========');
      console.log('📥 响应内容:', response);
    } catch (sendError) {
      console.error('❌ 发送消息失败:', sendError);
      
      // 检查是否是 Extension context invalidated 错误
      const errorMsg = sendError.message || sendError.toString();
      if (errorMsg.includes('Extension context invalidated') || errorMsg.includes('message port closed')) {
        saveBtn.innerHTML = '✗ 扩展已失效';
        saveBtn.style.backgroundColor = '#ef4444';
        setTimeout(() => {
          saveBtn.innerHTML = originalText;
          saveBtn.disabled = false;
          saveBtn.style.backgroundColor = '';
        }, 3000);
        alert('扩展上下文已失效。\n\n请刷新当前页面（F5 或 Cmd+R）后重试。');
        return;
      }
      
      // 处理超时错误
      if (errorMsg.includes('超时')) {
        saveBtn.innerHTML = '✗ 请求超时';
        saveBtn.style.backgroundColor = '#ef4444';
        setTimeout(() => {
          saveBtn.innerHTML = originalText;
          saveBtn.disabled = false;
          saveBtn.style.backgroundColor = '';
        }, 3000);
        alert('保存请求超时，请检查网络连接或稍后重试。');
        return;
      }
      
      throw sendError;
    }
    
    // 检查响应是否为空（可能 Service Worker 已关闭）
    if (!response) {
      console.error('❌ 响应为空，可能 Service Worker 已关闭');
      saveBtn.innerHTML = '✗ 无响应';
      saveBtn.style.backgroundColor = '#ef4444';
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        saveBtn.style.backgroundColor = '';
      }, 3000);
      alert('Background Service Worker 没有响应。\n\n请：\n1. 重新加载扩展\n2. 刷新页面后重试');
      return;
    }

    if (response && response.success) {
      // 保存成功
      console.log('✅ 保存成功！');
      saveBtn.innerHTML = '✓ 已保存';
      saveBtn.style.backgroundColor = '#10b981';
      
      // 2秒后关闭面板
      setTimeout(() => {
        if (floatingPanel) {
          floatingPanel.remove();
          floatingPanel = null;
        }
        // 清除选择
        window.getSelection().removeAllRanges();
      }, 2000);
    } else {
      // 保存失败
      console.error('❌ 保存失败');
      console.error('❌ 响应对象:', response);
      console.error('❌ 错误消息:', response?.message);
      console.error('❌ 错误代码:', response?.error);
      
      saveBtn.innerHTML = '✗ 保存失败';
      saveBtn.style.backgroundColor = '#ef4444';
      
      const errorMsg = response?.message || response?.error || '未知错误';
      console.error('❌ 错误详情:', errorMsg);
      
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        saveBtn.style.backgroundColor = '';
      }, 3000);
      
      // 如果是因为未配置，提示用户
      if (response?.error === 'not_configured') {
        alert('请先在插件选项中配置 Notion API 密钥');
      } else {
        alert(`保存失败: ${errorMsg}`);
      }
    }
  } catch (error) {
    console.error('❌ 保存到 Notion 异常:', error);
    const saveBtn = document.getElementById('save-to-notion');
    if (saveBtn) {
      saveBtn.innerHTML = '✗ 保存失败';
      saveBtn.style.backgroundColor = '#ef4444';
      alert(`保存失败: ${error.message}`);
    }
  }
}

// 将 handleSaveToNotion 绑定到 window（多个别名，确保都能访问）
window.handleSaveToNotion = handleSaveToNotion;
window.__notionSaveHandler = handleSaveToNotion;
window.__notionCancelHandler = handleCancel;

console.log('✅ 处理函数已绑定到 window 对象');
console.log('✅ window.__notionSaveHandler:', typeof window.__notionSaveHandler);

// 取消选择
function handleCancel() {
  // 先关闭所有打开的 dropdown
  const openDropdown = document.querySelector('.tag-dropdown.show');
  if (openDropdown) {
    openDropdown.classList.remove('show');
    const trigger = document.querySelector('.tag-trigger.active');
    if (trigger) {
      trigger.classList.remove('active');
      trigger.setAttribute('aria-expanded', 'false');
    }
  }
  
  if (floatingPanel) {
    floatingPanel.remove();
    floatingPanel = null;
  }
  // 清除选择
  window.getSelection().removeAllRanges();
  // 清除选中的标签
  selectedTagsSet.clear();
}

// 初始化标签选择器（简化版，平铺显示，参考 lovable 设计）
function initTagSelectorSimple(panel, availableTags) {
  const tagsGrid = panel.querySelector('#tags-grid');
  const tagsCount = panel.querySelector('#tags-count');
  const tagsCountNum = panel.querySelector('#tags-count-num');
  const newTagInput = panel.querySelector('#new-tag-input');
  
  if (!tagsGrid) return;
  
  // 更新选中的标签显示
  function updateSelectedTagsDisplay() {
    const selectedTags = Array.from(selectedTagsSet);
    
    if (selectedTags.length > 0) {
      if (tagsCount) tagsCount.style.display = 'block';
      if (tagsCountNum) tagsCountNum.textContent = selectedTags.length;
    } else {
      if (tagsCount) tagsCount.style.display = 'none';
    }
    
    // 更新标签的选中状态
    tagsGrid.querySelectorAll('.tag-badge-btn').forEach(btn => {
      const tagValue = btn.getAttribute('data-tag-value');
      if (selectedTagsSet.has(tagValue)) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }
  
  // 点击标签项切换选中状态
  tagsGrid.addEventListener('click', (e) => {
    const tagBtn = e.target.closest('.tag-badge-btn');
    if (!tagBtn) return;
    
    e.stopPropagation();
    const tagValue = tagBtn.getAttribute('data-tag-value');
    
    // 切换选中状态
    if (selectedTagsSet.has(tagValue)) {
      selectedTagsSet.delete(tagValue);
    } else {
      selectedTagsSet.add(tagValue);
    }
    
    updateSelectedTagsDisplay();
  });
  
  // 添加新标签
  function addNewTag() {
    if (!newTagInput) return;
    const tagValue = newTagInput.value.trim();
    if (!tagValue) return;
    
    // 检查是否已存在（不区分大小写）
    const existingTag = Array.from(selectedTagsSet).find(t => t.toLowerCase() === tagValue.toLowerCase());
    if (existingTag) {
      // 如果已存在，取消选中
      selectedTagsSet.delete(existingTag);
      updateSelectedTagsDisplay();
      newTagInput.value = '';
      return;
    }
    
    // 添加到选中集合
    selectedTagsSet.add(tagValue);
    
    // 添加到标签列表（如果不在列表中）
    const existingTagElement = tagsGrid.querySelector(`[data-tag-value="${tagValue.replace(/"/g, '&quot;')}"]`);
    if (!existingTagElement) {
      const tagId = `tag-${tagValue.replace(/[^a-zA-Z0-9]/g, '-')}`;
      const newTagHTML = `
        <button class="tag-badge-btn selected" data-tag-id="${tagId}" data-tag-value="${tagValue.replace(/"/g, '&quot;')}" type="button">
          <svg class="tag-check-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="2 6 5 9 10 2"></polyline>
          </svg>
          <span class="tag-badge-label">${tagValue}</span>
        </button>
      `;
      // 插入到新标签输入框之前
      newTagInput.parentElement.insertAdjacentHTML('beforebegin', newTagHTML);
    }
    
    newTagInput.value = '';
    updateSelectedTagsDisplay();
  }
  
  // 新标签输入框事件
  if (newTagInput) {
    newTagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        addNewTag();
      }
    });
    
    newTagInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  // 初始化显示
  updateSelectedTagsDisplay();
}

// 初始化标签选择器（参考 Radix UI 的实现方式）- 保留旧版本以防需要
function initTagSelector(panel, availableTags) {
  const tagTrigger = panel.querySelector('#tag-trigger');
  const tagDropdown = panel.querySelector('#tag-dropdown');
  const tagList = panel.querySelector('#tag-list');
  const tagTriggerContent = panel.querySelector('#tag-trigger-content');
  const tagsCount = panel.querySelector('#tags-count');
  const tagsCountNum = panel.querySelector('#tags-count-num');
  const newTagInput = panel.querySelector('#new-tag-input');
  const newTagAddBtn = panel.querySelector('#new-tag-add-btn');
  
  if (!tagTrigger || !tagDropdown) return;
  
  let dropdownInBody = false; // 标记 dropdown 是否在 body 中
  
  // 计算 dropdown 位置（参考 Radix UI 的定位逻辑）
  function updateDropdownPosition() {
    // 允许在未显示时也计算位置（用于打开前预计算）
    const isShowing = tagDropdown.classList.contains('show');
    
    if (!tagTrigger) {
      console.error('❌ tagTrigger 不存在');
      return;
    }
    
    const triggerRect = tagTrigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    console.log('📍 计算位置:', { triggerRect, viewportHeight, viewportWidth, isShowing });
    
    // 使用 fixed 定位时，使用视口坐标（不需要 scrollY/scrollX）
    // dropdown 宽度应该与 trigger 宽度匹配
    const dropdownWidth = triggerRect.width; // 与触发器宽度完全匹配
    
    // 默认在下方，左对齐
    let top = triggerRect.bottom + 8; // 视口坐标
    let left = triggerRect.left; // 视口坐标，与 trigger 左对齐
    let side = 'bottom';
    
    // 检查下方空间是否足够
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const dropdownHeight = 200; // max-height
    
    // 如果下方空间不足，且上方空间更大，则显示在上方
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      top = triggerRect.top - dropdownHeight - 8; // 视口坐标
      side = 'top';
    }
    
    // 水平方向：确保不超出视口，但优先保持左对齐
    if (left + dropdownWidth > viewportWidth - 8) {
      // 如果右边界超出，尝试右对齐
      left = triggerRect.right - dropdownWidth;
      // 如果还是超出，则调整到视口内
      if (left < 8) {
        left = 8;
      }
    }
    if (left < 8) {
      left = 8;
    }
    
    // 确保 top 在视口内
    if (top < 8) {
      top = 8;
    }
    if (top + dropdownHeight > viewportHeight - 8) {
      top = viewportHeight - dropdownHeight - 8;
      if (top < 8) {
        top = 8;
      }
    }
    
    // 应用位置和宽度（fixed 定位使用视口坐标）
    tagDropdown.style.position = 'fixed';
    tagDropdown.style.top = `${top}px`;
    tagDropdown.style.left = `${left}px`;
    tagDropdown.style.width = `${dropdownWidth}px`;
    tagDropdown.setAttribute('data-side', side);
    
    console.log('✅ 位置已应用:', { top, left, width: dropdownWidth, side, position: tagDropdown.style.position });
  }
  
  // 更新选中的标签显示
  function updateSelectedTagsDisplay() {
    const selectedTags = Array.from(selectedTagsSet);
    
    if (selectedTags.length > 0) {
      if (tagsCount) tagsCount.style.display = 'block';
      if (tagsCountNum) tagsCountNum.textContent = selectedTags.length;
      
      // 显示选中的标签
      if (tagTriggerContent) {
        tagTriggerContent.innerHTML = selectedTags.map(tag => 
          `<span class="tag-badge">${tag}</span>`
        ).join('');
      }
    } else {
      if (tagsCount) tagsCount.style.display = 'none';
      if (tagTriggerContent) {
        tagTriggerContent.innerHTML = '<span class="tag-trigger-placeholder">点击选择标签...</span>';
      }
    }
    
    // 更新下拉菜单中的选中状态
    if (tagList) {
      tagList.querySelectorAll('.tag-item').forEach(item => {
        const tagValue = item.getAttribute('data-tag-value');
        if (selectedTagsSet.has(tagValue)) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
    }
  }
  
  // 打开下拉菜单
  function openDropdown() {
    console.log('🔽 打开 dropdown');
    
    // 先移动到 body（如果还没移动）
    if (!dropdownInBody) {
      console.log('📦 移动 dropdown 到 body');
      
      // 保存面板的当前状态（使用 getBoundingClientRect 获取实际位置）
      const panelRect = panel.getBoundingClientRect();
      const panelLeft = panel.style.left;
      const panelTop = panel.style.top;
      const panelPosition = window.getComputedStyle(panel).position;
      const panelZIndex = window.getComputedStyle(panel).zIndex;
      
      // 计算文档坐标（考虑滚动）
      const savedLeft = panelRect.left + window.scrollX;
      const savedTop = panelRect.top + window.scrollY;
      
      console.log('💾 面板当前状态:', { 
        styleLeft: panelLeft, 
        styleTop: panelTop, 
        computedLeft: savedLeft,
        computedTop: savedTop,
        panelPosition, 
        panelZIndex,
        panelRect 
      });
      
      // 确保 dropdown 在移动前是隐藏的（避免闪烁）
      // 先移除 show 类，确保不显示
      tagDropdown.classList.remove('show');
      tagDropdown.style.display = 'none';
      tagDropdown.style.visibility = 'hidden';
      tagDropdown.style.opacity = '0';
      
      // 移动 dropdown 到 body
      document.body.appendChild(tagDropdown);
      dropdownInBody = true;
      
      // 确保在 body 中后立即设置 fixed 定位
      tagDropdown.style.position = 'fixed';
      
      // 立即检查并恢复面板位置（如果被影响）
      const checkAndRestore = () => {
        const currentRect = panel.getBoundingClientRect();
        const currentLeft = panel.style.left;
        const currentTop = panel.style.top;
        const currentPosition = window.getComputedStyle(panel).position;
        const currentComputedLeft = currentRect.left + window.scrollX;
        const currentComputedTop = currentRect.top + window.scrollY;
        
        // 检查位置是否被改变（允许 1px 的误差）
        const leftDiff = Math.abs(parseFloat(currentLeft) - parseFloat(panelLeft));
        const topDiff = Math.abs(parseFloat(currentTop) - parseFloat(panelTop));
        const computedLeftDiff = Math.abs(currentComputedLeft - savedLeft);
        const computedTopDiff = Math.abs(currentComputedTop - savedTop);
        
        if (leftDiff > 1 || topDiff > 1 || computedLeftDiff > 1 || computedTopDiff > 1 || currentPosition !== 'absolute') {
          console.warn('⚠️ 检测到面板位置/样式被改变，正在恢复...', {
            original: { left: panelLeft, top: panelTop, computedLeft: savedLeft, computedTop: savedTop, position: panelPosition },
            current: { left: currentLeft, top: currentTop, computedLeft: currentComputedLeft, computedTop: currentComputedTop, position: currentPosition },
            diff: { leftDiff, topDiff, computedLeftDiff, computedTopDiff }
          });
          
          // 强制恢复（优先使用保存的 style 值，如果没有则使用计算值）
          panel.style.position = 'absolute';
          panel.style.left = panelLeft || `${savedLeft}px`;
          panel.style.top = panelTop || `${savedTop}px`;
          panel.style.zIndex = panelZIndex || '2147483647';
          
          console.log('✅ 面板位置已恢复:', { 
            left: panel.style.left, 
            top: panel.style.top,
            position: panel.style.position
          });
        }
      };
      
      // 立即检查
      checkAndRestore();
      
      // 在下一帧再检查一次
      requestAnimationFrame(checkAndRestore);
      
      // 延迟一点再检查（确保所有布局完成）
      setTimeout(checkAndRestore, 10);
      setTimeout(checkAndRestore, 50);
    }
    
    // 先计算位置（在显示前）
    updateDropdownPosition();
    
    // 然后显示 dropdown（使用 requestAnimationFrame 确保位置已计算）
    requestAnimationFrame(() => {
      // 再次更新位置（确保正确）
      updateDropdownPosition();
      
      // 显示 dropdown
      tagDropdown.style.opacity = '1';
      tagDropdown.style.visibility = 'visible';
      tagDropdown.classList.add('show');
      
      // 检查 dropdown 是否真的可见
      requestAnimationFrame(() => {
        const rect = tagDropdown.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(tagDropdown);
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         rect.top >= 0 && rect.left >= 0 &&
                         rect.bottom <= window.innerHeight && 
                         rect.right <= window.innerWidth;
        console.log('🔍 Dropdown 可见性检查:', { 
          rect, 
          isVisible, 
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          zIndex: computedStyle.zIndex,
          position: computedStyle.position
        });
        
        if (!isVisible) {
          console.warn('⚠️ Dropdown 不可见，尝试修复位置...');
          updateDropdownPosition();
        }
      });
    });
    
    tagTrigger.classList.add('active');
    tagTrigger.setAttribute('aria-expanded', 'true');
    
    // 监听滚动和窗口大小变化，更新位置
    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);
    
    // 聚焦到第一个标签项或输入框（参考 Radix UI）
    setTimeout(() => {
      if (newTagInput) {
        newTagInput.focus();
      } else if (tagList) {
        const firstItem = tagList.querySelector('.tag-item');
        if (firstItem) firstItem.focus();
      }
    }, 0);
  }
  
  // 关闭下拉菜单
  function closeDropdown() {
    tagDropdown.classList.remove('show');
    tagDropdown.style.visibility = 'hidden';
    tagTrigger.classList.remove('active');
    tagTrigger.setAttribute('aria-expanded', 'false');
    
    // 移除事件监听
    window.removeEventListener('scroll', updateDropdownPosition, true);
    window.removeEventListener('resize', updateDropdownPosition);
    
    // 如果 dropdown 在 body 中，移回原位置（可选，也可以保留在 body）
    // 这里我们保留在 body 中，只是隐藏
  }
  
  // 切换下拉菜单显示
  function toggleDropdown() {
    const isOpen = tagDropdown.classList.contains('show');
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }
  
  // 点击触发器
  tagTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });
  
  // 点击标签项（参考 Radix UI 的交互）
  if (tagList) {
    tagList.addEventListener('click', (e) => {
      const tagItem = e.target.closest('.tag-item');
      if (!tagItem) return;
      
      // 阻止事件冒泡到 document，避免关闭面板
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const tagValue = tagItem.getAttribute('data-tag-value');
      
      // 切换选中状态
      const wasSelected = selectedTagsSet.has(tagValue);
      if (wasSelected) {
        selectedTagsSet.delete(tagValue);
        tagItem.setAttribute('aria-selected', 'false');
      } else {
        selectedTagsSet.add(tagValue);
        tagItem.setAttribute('aria-selected', 'true');
      }
      
      updateSelectedTagsDisplay();
      // 不自动关闭，允许多选（参考 Radix UI CheckboxItem）
    });
    
    // 阻止 dropdown 内的滚动事件冒泡到页面
    tagList.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });
    
    tagList.addEventListener('touchmove', (e) => {
      e.stopPropagation();
    }, { passive: true });
  }
  
  // 阻止整个 dropdown 的滚动事件冒泡
  if (tagDropdown) {
    tagDropdown.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });
    
    tagDropdown.addEventListener('touchmove', (e) => {
      e.stopPropagation();
    }, { passive: true });
  }
  
  // 添加新标签
  function addNewTag() {
    if (!newTagInput) return;
    const tagValue = newTagInput.value.trim();
    if (!tagValue) return;
    
    // 检查是否已存在（不区分大小写）
    const existingTag = Array.from(selectedTagsSet).find(t => t.toLowerCase() === tagValue.toLowerCase());
    if (existingTag) {
      // 如果已存在，取消选中
      selectedTagsSet.delete(existingTag);
      updateSelectedTagsDisplay();
      newTagInput.value = '';
      return;
    }
    
    // 添加到选中集合
    selectedTagsSet.add(tagValue);
    
    // 添加到标签列表（如果不在列表中）
    if (tagList) {
      const existingTagElement = tagList.querySelector(`[data-tag-value="${tagValue.replace(/"/g, '&quot;')}"]`);
      if (!existingTagElement) {
        const tagId = `tag-${tagValue.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const newTagHTML = `
          <button class="tag-item selected" data-tag-id="${tagId}" data-tag-value="${tagValue.replace(/"/g, '&quot;')}">
            <div class="tag-checkbox">
              <svg class="tag-checkbox-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="2 6 5 9 10 2"></polyline>
              </svg>
            </div>
            <span class="tag-item-label">${tagValue}</span>
          </button>
        `;
        tagList.insertAdjacentHTML('beforeend', newTagHTML);
      }
    }
    
    newTagInput.value = '';
    updateSelectedTagsDisplay();
    
    // 聚焦到输入框，方便继续添加
    if (newTagInput) {
      setTimeout(() => newTagInput.focus(), 0);
    }
  }
  
  // 新标签输入框事件（参考 Radix UI 的键盘交互）
  if (newTagInput) {
    newTagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addNewTag();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
        tagTrigger.focus();
      }
    });
    
    // 防止输入框的点击事件冒泡到 document
    newTagInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  if (newTagAddBtn) {
    newTagAddBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      addNewTag();
    });
  }
  
  // 阻止 dropdown 内所有元素的点击事件冒泡（避免关闭面板）
  if (tagDropdown) {
    tagDropdown.addEventListener('click', (e) => {
      // 只阻止冒泡，不阻止默认行为
      e.stopPropagation();
    }, true); // 使用捕获阶段，优先处理
  }
  
  // 点击外部关闭下拉菜单（参考 Radix UI 的实现）
  const closeDropdownHandler = function(e) {
    if (tagDropdown && tagDropdown.classList.contains('show')) {
      // 如果点击的不是面板内的元素，也不是 dropdown 内的元素，关闭下拉菜单
      const clickedInPanel = panel.contains(e.target);
      const clickedInDropdown = tagDropdown.contains(e.target);
      const clickedInTrigger = tagTrigger.contains(e.target);
      
      // 如果点击在 trigger 上，不关闭（toggleDropdown 会处理）
      if (clickedInTrigger) {
        return;
      }
      
      // 如果点击在 dropdown 内，不关闭
      if (clickedInDropdown) {
        return;
      }
      
      // 如果点击在面板内但不在 dropdown 内，也不关闭（可能是其他操作）
      if (clickedInPanel) {
        return;
      }
      
      // 只有点击在外部时才关闭
      closeDropdown();
    }
  };
  
  // 使用捕获阶段，确保能捕获到所有点击
  // 延迟绑定，避免与标签项的点击冲突
  setTimeout(() => {
    document.addEventListener('click', closeDropdownHandler, true);
  }, 100);
  
  // ESC 键关闭（参考 Radix UI）
  const escapeHandler = function(e) {
    if (e.key === 'Escape' && tagDropdown.classList.contains('show')) {
      e.preventDefault();
      closeDropdown();
      tagTrigger.focus();
    }
  };
  document.addEventListener('keydown', escapeHandler);
  
  // 清理函数（当面板被移除时）
  const cleanup = function() {
    document.removeEventListener('click', closeDropdownHandler, true);
    document.removeEventListener('keydown', escapeHandler);
    window.removeEventListener('scroll', updateDropdownPosition, true);
    window.removeEventListener('resize', updateDropdownPosition);
    // 如果 dropdown 还在 body 中，移除它
    if (tagDropdown && tagDropdown.parentElement === document.body) {
      tagDropdown.remove();
      dropdownInBody = false;
    }
  };
  
  // 监听面板移除事件
  const observer = new MutationObserver((mutations) => {
    if (!document.body.contains(panel)) {
      cleanup();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  
  // 初始化显示
  updateSelectedTagsDisplay();
}

// 创建简化版面板（备用方案，当主面板创建失败时使用）
function createSimplePanel(x, y) {
  if (floatingPanel) {
    floatingPanel.remove();
  }

  console.log('🎨 创建简化版浮层面板');
  
  floatingPanel = document.createElement('div');
  floatingPanel.id = 'notion-highlight-panel';
  
  floatingPanel.innerHTML = `
    <div class="panel-content">
      <div class="panel-actions">
        <button id="save-to-notion" class="notion-btn notion-btn-primary" onclick="if(window.__notionSaveHandler) { window.__notionSaveHandler(); } return false;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          收藏到 Notion
        </button>
        <button id="cancel-selection" class="notion-btn notion-btn-secondary" onclick="window.__notionCancelHandler && window.__notionCancelHandler(); return false;">
          取消
        </button>
      </div>
    </div>
  `;
  
  window.__notionSaveHandler = handleSaveToNotion;
  window.__notionCancelHandler = handleCancel;

  floatingPanel.style.left = `${x}px`;
  floatingPanel.style.top = `${y}px`;
  document.body.appendChild(floatingPanel);
  floatingPanel.style.opacity = '1';
  
  console.log('✅ 简化版浮层面板已添加');
}

// 加载标签列表（优先使用缓存，后台同步）
async function loadTags() {
  try {
    // 先从缓存读取
    const cached = await chrome.storage.local.get(['tags', 'tagsLastSync']);
    
    // 总是先返回缓存（即使过期），然后在后台同步
    if (cached.tags && Array.isArray(cached.tags)) {
      console.log('📋 使用缓存的标签（可能过期）:', cached.tags);
      
      // 如果缓存过期，在后台尝试同步（不阻塞）
      const now = Date.now();
      if (!cached.tagsLastSync || (now - cached.tagsLastSync > 24 * 60 * 60 * 1000)) {
        console.log('📋 缓存已过期，后台同步标签...');
        syncTagsInBackground().catch(err => {
          console.warn('⚠️ 后台同步标签失败:', err);
        });
      }
      
      return cached.tags;
    }
    
    // 如果没有缓存，尝试同步（但设置短超时）
    console.log('📋 无缓存，尝试同步标签...');
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage || !chrome.runtime.id) {
        console.warn('⚠️ chrome.runtime 不可用');
        return [];
      }
      
      const response = await Promise.race([
        chrome.runtime.sendMessage({ action: 'syncTags' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('标签同步超时')), 5000))
      ]);
      
      if (response && response.success && response.tags) {
        console.log('📋 从 Notion 同步的标签:', response.tags);
        return response.tags || [];
      }
    } catch (syncError) {
      console.warn('⚠️ 标签同步失败，返回空列表:', syncError.message);
    }
    
    return [];
  } catch (error) {
    console.error('❌ 加载标签失败:', error);
    return [];
  }
}

// 后台同步标签（不阻塞）
async function syncTagsInBackground() {
  try {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage || !chrome.runtime.id) {
      return;
    }
    
    const response = await Promise.race([
      chrome.runtime.sendMessage({ action: 'syncTags' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('超时')), 8000))
    ]);
    
    if (response && response.success && response.tags) {
      console.log('📋 后台同步标签成功:', response.tags);
    }
  } catch (error) {
    // 后台同步失败不显示错误
    console.warn('⚠️ 后台同步标签失败（静默）:', error.message);
  }
}

// 更新面板中的标签列表（简化版，平铺显示）
function updatePanelTags(tags) {
  if (!floatingPanel) return;
  
  const tagsGrid = floatingPanel.querySelector('#tags-grid');
  if (!tagsGrid) return;
  
  // 更新标签列表
  if (tags.length > 0) {
    const existingTags = new Set();
    tagsGrid.querySelectorAll('.tag-badge-btn').forEach(btn => {
      existingTags.add(btn.getAttribute('data-tag-value'));
    });
    
    // 添加新标签（如果不在列表中）
    const newTagInputWrapper = tagsGrid.querySelector('.new-tag-input-wrapper');
    tags.forEach(tag => {
      const tagValue = tag.replace(/"/g, '&quot;');
      if (!existingTags.has(tagValue)) {
        const tagId = `tag-${tag.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const isSelected = selectedTagsSet.has(tag);
        const tagHTML = `
          <button class="tag-badge-btn ${isSelected ? 'selected' : ''}" data-tag-id="${tagId}" data-tag-value="${tagValue}" type="button">
            ${isSelected ? `
              <svg class="tag-check-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="2 6 5 9 10 2"></polyline>
              </svg>
            ` : ''}
            <span class="tag-badge-label">${tag}</span>
          </button>
        `;
        // 插入到新标签输入框之前
        if (newTagInputWrapper) {
          newTagInputWrapper.insertAdjacentHTML('beforebegin', tagHTML);
        } else {
          tagsGrid.insertAdjacentHTML('beforeend', tagHTML);
        }
      }
    });
    
    // 更新选中状态
    tagsGrid.querySelectorAll('.tag-badge-btn').forEach(btn => {
      const tagValue = btn.getAttribute('data-tag-value');
      if (selectedTagsSet.has(tagValue)) {
        btn.classList.add('selected');
        // 确保有 check icon
        if (!btn.querySelector('.tag-check-icon')) {
          btn.insertAdjacentHTML('afterbegin', `
            <svg class="tag-check-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="2 6 5 9 10 2"></polyline>
            </svg>
          `);
        }
      } else {
        btn.classList.remove('selected');
        // 移除 check icon
        const checkIcon = btn.querySelector('.tag-check-icon');
        if (checkIcon) {
          checkIcon.remove();
        }
      }
    });
  }
}

// 创建浮层面板
async function createFloatingPanel(x, y) {
  // 如果面板已存在，先移除
  if (floatingPanel) {
    floatingPanel.remove();
  }

  console.log('🎨 开始创建浮层面板');
  
  // 先尝试快速从缓存加载标签
  let availableTags = [];
  try {
    const cached = await chrome.storage.local.get(['tags', 'tagsLastSync']);
    if (cached.tags && cached.tagsLastSync) {
      const now = Date.now();
      // 如果缓存未过期，直接使用
      if (now - cached.tagsLastSync < 24 * 60 * 60 * 1000) {
        availableTags = cached.tags || [];
        console.log('📋 快速加载缓存的标签:', availableTags);
      }
    }
  } catch (error) {
    console.warn('⚠️ 快速加载缓存失败:', error);
  }
  
  // 创建面板元素（先显示，标签可以后续更新）
  floatingPanel = document.createElement('div');
  floatingPanel.id = 'notion-highlight-panel';
  
  // 重置选中的标签集合
  selectedTagsSet.clear();
  
  // 构建标签列表 HTML（平铺显示，参考 lovable 设计）
  const buildTagListHTML = (tags) => {
    if (tags.length === 0) {
      return ''; // 没有标签时返回空，显示添加新标签输入框
    }
    return tags.map(tag => {
      const tagId = `tag-${tag.replace(/[^a-zA-Z0-9]/g, '-')}`;
      const isSelected = selectedTagsSet.has(tag);
      // 使用 TagBadge 样式
      return `
        <button class="tag-badge-btn ${isSelected ? 'selected' : ''}" data-tag-id="${tagId}" data-tag-value="${tag.replace(/"/g, '&quot;')}" type="button">
          ${isSelected ? `
            <svg class="tag-check-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="2 6 5 9 10 2"></polyline>
            </svg>
          ` : ''}
          <span class="tag-badge-label">${tag}</span>
        </button>
      `;
    }).join('');
  };
  
  // 使用内联事件处理，确保事件能触发
  floatingPanel.innerHTML = `
    <div class="panel-content">
      <!-- Header -->
      <div class="panel-header">
        <div class="panel-header-top">
          <div class="panel-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h3 class="panel-title">保存到 Notion</h3>
        </div>
        <!-- 选中文本预览 -->
        <div class="text-preview">
          <p class="text-preview-content">"${(selectedText || '').substring(0, 100)}${(selectedText || '').length > 100 ? '...' : ''}"</p>
        </div>
      </div>
      
      <!-- Tags section -->
      <div class="tags-section">
        <div class="tags-label-row">
          <span class="tags-label">选择标签</span>
          <span class="tags-count" id="tags-count" style="display: none;">已选 <span id="tags-count-num">0</span> 个</span>
        </div>
        
        <!-- 标签列表（平铺显示） -->
        <div class="tags-grid" id="tags-grid">
          ${buildTagListHTML(availableTags)}
          
          <!-- 新标签输入（在标签列表末尾） -->
          <div class="new-tag-input-wrapper">
            <svg class="new-tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <input type="text" id="new-tag-input" class="new-tag-input" placeholder="新增标签，回车确认">
          </div>
        </div>
      </div>
      
      <!-- Comments section -->
      <div class="comments-section">
        <div class="comments-label-row">
          <span class="comments-label">添加评论（可选）</span>
        </div>
        <div class="comments-input-wrapper">
          <textarea id="comment-input" class="comment-input" placeholder="输入你的评论..." rows="3"></textarea>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="panel-actions">
        <button id="cancel-selection" class="notion-btn notion-btn-secondary" onclick="window.__notionCancelHandler && window.__notionCancelHandler(); return false;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          取消
        </button>
        <button id="save-to-notion" class="notion-btn notion-btn-primary" onclick="console.log('🖱️ 内联 onclick 被触发了！'); if(window.__notionSaveHandler) { window.__notionSaveHandler(); } else { alert('函数未找到！'); } return false;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          保存
        </button>
      </div>
    </div>
  `;
  
  // 将处理函数绑定到 window 对象，以便内联 onclick 可以访问
  window.__notionSaveHandler = handleSaveToNotion;
  window.__notionCancelHandler = handleCancel;

  // 设置面板位置
  floatingPanel.style.left = `${x}px`;
  floatingPanel.style.top = `${y}px`;

  // 添加到页面
  document.body.appendChild(floatingPanel);
  
  // 强制设置 opacity 为 1，确保面板可见
  floatingPanel.style.opacity = '1';
  
  // 初始化标签选择逻辑（简化版，平铺显示）
  initTagSelectorSimple(floatingPanel, availableTags);
  
  console.log('✅ 浮层面板已添加到页面');
  
  // 异步加载并更新标签（不阻塞面板显示）
  // 如果当前没有标签，尝试在后台加载
  if (availableTags.length === 0) {
    // 延迟一点，确保面板已经显示
    setTimeout(() => {
      loadTags().then(tags => {
        if (tags && tags.length > 0) {
          console.log('📋 异步加载标签完成，更新面板:', tags);
          updatePanelTags(tags);
        }
      }).catch(error => {
        console.warn('⚠️ 异步加载标签失败:', error);
      });
    }, 100);
  }
  
  // 调试：检查面板是否真的在页面上
  const panel = document.getElementById('notion-highlight-panel');
  if (panel) {
    const rect = panel.getBoundingClientRect();
    console.log('🔍 面板位置和尺寸:', {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      display: window.getComputedStyle(panel).display,
      visibility: window.getComputedStyle(panel).visibility,
      opacity: window.getComputedStyle(panel).opacity,
      zIndex: window.getComputedStyle(panel).zIndex
    });
  } else {
    console.error('❌ 面板元素不存在于 DOM 中');
  }

  // 等待 DOM 完全渲染后绑定事件（使用 setTimeout 确保 DOM 已更新）
  // 立即绑定事件，不等待 setTimeout
  // 使用 requestAnimationFrame 确保 DOM 已准备好
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      console.log('⏰ 开始绑定按钮事件...');
      const saveBtn = document.getElementById('save-to-notion');
      const cancelBtn = document.getElementById('cancel-selection');
      
      console.log('🔍 查找按钮元素:', { 
        saveBtn: saveBtn ? '找到' : '未找到',
        cancelBtn: cancelBtn ? '找到' : '未找到'
      });
      
      if (!saveBtn) {
        console.error('❌ 无法找到保存按钮！');
        return;
      }
      
      // 创建事件处理函数
      const saveHandler = function(e) {
        console.log('🖱️ ========== 保存按钮点击事件（直接绑定）==========');
        console.log('🖱️ 事件对象:', e);
        console.log('🖱️ 事件类型:', e.type);
        console.log('🖱️ 事件目标:', e.target);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleSaveToNotion();
        return false;
      };
      
      // 方法1: 使用 addEventListener（捕获阶段）
      saveBtn.addEventListener('click', saveHandler, true);
      console.log('✅ 方法1: addEventListener (捕获阶段) 已绑定');
      
      // 方法2: 使用 addEventListener（冒泡阶段）
      saveBtn.addEventListener('click', saveHandler, false);
      console.log('✅ 方法2: addEventListener (冒泡阶段) 已绑定');
      
      // 方法3: 使用 onclick
      saveBtn.onclick = saveHandler;
      console.log('✅ 方法3: onclick 已绑定');
      
      // 方法4: 使用 onmousedown（作为备用，用于调试）
      saveBtn.onmousedown = function(e) {
        console.log('🖱️ ========== 保存按钮 mousedown 事件==========');
        console.log('🖱️ mousedown 事件对象:', e);
        console.log('🖱️ mousedown 事件目标:', e.target);
        // 阻止事件传播到 document，避免触发 handleTextSelection
        e.stopPropagation();
        // 不阻止默认行为，让 click 事件也能触发
      };
      
      // 方法5: 使用 addEventListener mousedown（用于调试）
      saveBtn.addEventListener('mousedown', function(e) {
        console.log('🖱️ ========== 保存按钮 mousedown 事件（addEventListener）==========');
        console.log('🖱️ mousedown 事件对象:', e);
        console.log('🖱️ mousedown 事件目标:', e.target);
        // 阻止事件传播到 document，避免触发 handleTextSelection
        e.stopPropagation();
        // 不阻止默认行为，让 click 事件也能触发
      }, false);
      
      // 方法6: 使用 addEventListener mouseup（用于调试）
      saveBtn.addEventListener('mouseup', function(e) {
        console.log('🖱️ ========== 保存按钮 mouseup 事件==========');
        console.log('🖱️ mouseup 事件对象:', e);
        console.log('🖱️ mouseup 事件目标:', e.target);
        // 阻止事件传播到 document，避免触发 handleTextSelection
        e.stopPropagation();
        // 不阻止默认行为，让 click 事件也能触发
      }, false);
      
      // 方法7: 直接在按钮上添加调试，检查元素是否可点击
      console.log('🔍 按钮元素信息:', {
        disabled: saveBtn.disabled,
        style: {
          pointerEvents: window.getComputedStyle(saveBtn).pointerEvents,
          cursor: window.getComputedStyle(saveBtn).cursor,
          display: window.getComputedStyle(saveBtn).display,
          visibility: window.getComputedStyle(saveBtn).visibility,
          opacity: window.getComputedStyle(saveBtn).opacity,
          zIndex: window.getComputedStyle(saveBtn).zIndex,
          position: window.getComputedStyle(saveBtn).position
        },
        rect: saveBtn.getBoundingClientRect(),
        isConnected: saveBtn.isConnected
      });
      
      // 绑定取消按钮
      if (cancelBtn) {
        const cancelHandler = function(e) {
          console.log('🖱️ ========== 取消按钮点击事件==========');
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          handleCancel();
          return false;
        };
        
        cancelBtn.addEventListener('click', cancelHandler, true);
        cancelBtn.addEventListener('click', cancelHandler, false);
        cancelBtn.onclick = cancelHandler;
      }
      
      console.log('✅ 所有按钮事件已绑定');
    });
  });
  
  // 使用事件委托（捕获和冒泡阶段都监听，确保能捕获到事件）
  const panelClickHandler = function(e) {
    console.log('🖱️ ========== 面板点击事件（事件委托）==========');
    console.log('🖱️ 点击目标:', e.target);
    console.log('🖱️ 目标标签:', e.target.tagName);
    console.log('🖱️ 目标 ID:', e.target.id);
    console.log('🖱️ 目标类名:', e.target.className);
    console.log('🖱️ 目标父元素:', e.target.parentElement);
    console.log('🖱️ 目标是否在按钮内:', e.target.closest('button'));
    
    // 检查是否点击了保存按钮或其内部元素
    let clickedButton = null;
    
    // 方法1: 直接检查目标是否是按钮
    if (e.target.id === 'save-to-notion') {
      clickedButton = e.target;
      console.log('🖱️ 方法1: 目标就是保存按钮');
    }
    // 方法2: 检查目标的父元素是否是按钮
    else if (e.target.parentElement && e.target.parentElement.id === 'save-to-notion') {
      clickedButton = e.target.parentElement;
      console.log('🖱️ 方法2: 目标的父元素是保存按钮');
    }
    // 方法3: 使用 closest
    else {
      clickedButton = e.target.closest('#save-to-notion');
      if (clickedButton) {
        console.log('🖱️ 方法3: 使用 closest 找到保存按钮');
      }
    }
    
    if (clickedButton) {
      console.log('🖱️ ========== 事件委托：保存按钮被点击了！==========');
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      handleSaveToNotion();
      return false;
    }
    
    // 检查是否点击了取消按钮
    let clickedCancelButton = null;
    if (e.target.id === 'cancel-selection') {
      clickedCancelButton = e.target;
    } else if (e.target.parentElement && e.target.parentElement.id === 'cancel-selection') {
      clickedCancelButton = e.target.parentElement;
    } else {
      clickedCancelButton = e.target.closest('#cancel-selection');
    }
    
    if (clickedCancelButton) {
      console.log('🖱️ ========== 事件委托：取消按钮被点击了！==========');
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      handleCancel();
      return false;
    }
    
    console.log('🖱️ 点击的不是按钮，忽略');
  };
  
  // 在捕获阶段监听
  floatingPanel.addEventListener('click', panelClickHandler, true);
  // 在冒泡阶段监听
  floatingPanel.addEventListener('click', panelClickHandler, false);
  
  // 添加 mousedown 事件监听（用于调试）
  floatingPanel.addEventListener('mousedown', function(e) {
    console.log('🖱️ ========== 面板 mousedown 事件==========');
    console.log('🖱️ mousedown 事件目标:', e.target);
    console.log('🖱️ mousedown 目标 ID:', e.target.id);
    console.log('🖱️ mousedown 目标标签:', e.target.tagName);
    // 阻止事件传播到 document，避免触发 handleTextSelection
    e.stopPropagation();
  }, false);
  
  // 添加 mouseup 事件监听（用于调试）
  floatingPanel.addEventListener('mouseup', function(e) {
    console.log('🖱️ ========== 面板 mouseup 事件==========');
    console.log('🖱️ mouseup 事件目标:', e.target);
    console.log('🖱️ mouseup 目标 ID:', e.target.id);
    console.log('🖱️ mouseup 目标标签:', e.target.tagName);
    // 阻止事件传播到 document，避免触发 handleTextSelection
    e.stopPropagation();
  }, false);
  
  console.log('✅ 面板事件委托已设置（捕获 + 冒泡 + mousedown + mouseup）');
}

// 获取选中文本的位置
function getSelectionPosition() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return {
    x: rect.left + window.scrollX,
    y: rect.bottom + window.scrollY + 5, // 在选中文本下方 5px
    width: rect.width,
    height: rect.height
  };
}

// 处理文本选择
function handleTextSelection(e) {
  // 如果点击的是面板内的元素，不处理（避免在点击按钮时触发）
  if (floatingPanel && e && e.target && floatingPanel.contains(e.target)) {
    console.log('🔍 文本选择事件：点击在面板内，忽略');
    return;
  }
  
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  console.log('🔍 文本选择事件触发，选中文本长度:', text.length);
  
  if (text.length === 0) {
    // 如果没有选中文本，隐藏面板
    if (floatingPanel) {
      console.log('🔍 文本选择事件：没有选中文本，隐藏面板');
      floatingPanel.remove();
      floatingPanel = null;
    }
    return;
  }

  console.log('📝 选中的文本:', text.substring(0, 50) + '...');
  
  // 保存到全局变量
  selectedText = text;
  selectionRange = selection.getRangeAt(0).cloneRange();

  // 获取选中位置
  const position = getSelectionPosition();
  console.log('📍 选中位置:', position);
  
  if (position) {
    console.log('🎨 创建浮层面板，位置:', position.x, position.y);
    // 异步创建面板，但不等待（避免阻塞）
    createFloatingPanel(position.x, position.y).catch(error => {
      console.error('❌ 创建面板失败:', error);
      // 即使失败，也尝试创建一个简化版面板
      createSimplePanel(position.x, position.y);
    });
  } else {
    console.error('❌ 无法获取选中位置');
  }
}

// 监听文本选择事件
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', (e) => {
  // 如果按下了 Shift、Ctrl 或 Cmd 键，可能是扩展选择
  if (e.shiftKey || e.ctrlKey || e.metaKey) {
    setTimeout(handleTextSelection, 100);
  }
});

// 点击页面其他地方时隐藏面板（使用 click 事件，在 click 事件之后处理）
document.addEventListener('click', (e) => {
  // 如果点击的是面板或面板内的元素，不处理
  if (floatingPanel && floatingPanel.contains(e.target)) {
    console.log('🖱️ click: 点击在面板内，不隐藏面板');
    return;
  }
  
  // 如果点击的不是面板，延迟隐藏（让按钮的 click 事件先处理）
  if (floatingPanel && !floatingPanel.contains(e.target)) {
    setTimeout(() => {
      // 检查面板是否还存在（可能在按钮的 click 事件中被移除了）
      if (!floatingPanel) return;
      
      // 检查是否在选中文本范围内
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const clickX = e.clientX;
        const clickY = e.clientY;
        
        // 如果点击不在选中文本范围内，隐藏面板
        if (clickX < rect.left || clickX > rect.right || 
            clickY < rect.top || clickY > rect.bottom) {
          console.log('🖱️ click: 点击在面板外，隐藏面板');
          if (floatingPanel) {
            floatingPanel.remove();
            floatingPanel = null;
          }
        }
      } else {
        // 如果没有选中文本，隐藏面板
        console.log('🖱️ click: 没有选中文本，隐藏面板');
        if (floatingPanel) {
          floatingPanel.remove();
          floatingPanel = null;
        }
      }
    }, 100); // 延迟 100ms，让按钮的 click 事件先处理
  }
}, false); // 使用冒泡阶段

// 页面滚动时更新面板位置
window.addEventListener('scroll', () => {
  if (floatingPanel && selectionRange) {
    const position = getSelectionPosition();
    if (position) {
      floatingPanel.style.left = `${position.x}px`;
      floatingPanel.style.top = `${position.y}px`;
    }
  }
}, true);

