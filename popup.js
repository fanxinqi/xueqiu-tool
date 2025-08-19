// popup.js - 处理弹窗界面逻辑
class PopupController {
  constructor() {
    this.isRunning = false;
    this.startTime = null;
    this.timer = null;
    this.lastTabId = null;
    this.init();
  }

  async init() {
    this.toggleBtn = document.getElementById('toggleBtn');
    this.status = document.getElementById('status');
    this.itemCount = document.getElementById('itemCount');
    this.pageCount = document.getElementById('pageCount');
    this.runTime = document.getElementById('runTime');
    this.downloadBtn = document.getElementById('downloadBtn');
    this.resetBtn = document.getElementById('resetBtn');

    // 绑定事件
    this.toggleBtn.addEventListener('click', () => this.toggleCrawler());
    this.downloadBtn.addEventListener('click', () => this.downloadData());
    this.resetBtn.addEventListener('click', () => this.resetData());

    // 获取当前状态
    await this.updateStatus();
    
    // 定期更新状态
    setInterval(() => this.updateStatus(), 1000);
    
    // 检查全局状态
    await this.checkGlobalState();
  }

  // 检查Chrome存储中的全局状态
  async checkGlobalState() {
    try {
      const result = await chrome.storage.local.get(['crawlerState']);
      if (result.crawlerState) {
        const state = result.crawlerState;
        // 检查状态是否有效（5分钟内）
        if (Date.now() - state.lastUpdate < 5 * 60 * 1000) {
          if (state.isRunning && !this.isRunning) {
            console.log('检测到其他tab中有运行中的爬虫');
            this.startCrawler();
            this.itemCount.textContent = state.collectedData?.length || 0;
          } else if (!state.isRunning && this.isRunning) {
            console.log('检测到爬虫在其他地方被停止');
            this.stopCrawler();
          }
        }
      }
    } catch (error) {
      console.error('检查全局状态失败:', error);
    }
  }

  async toggleCrawler() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查是否在雪球网站
      if (!tab.url || !tab.url.includes('xueqiu.com')) {
        this.updateStatusDisplay('请在雪球网站上使用此工具', 'inactive');
        return;
      }

      // 首先尝试检查连接
      const isConnected = await this.checkConnection(tab.id);
      if (!isConnected) {
        this.updateStatusDisplay('正在注入脚本...', 'active');
        // 尝试注入content script
        await this.injectContentScript(tab.id);
        // 等待一下让脚本初始化
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!this.isRunning) {
        // 启动爬虫
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'startCrawler' });
        if (response && response.success) {
          this.startCrawler();
        } else {
          throw new Error('启动爬虫失败');
        }
      } else {
        // 停止爬虫
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'stopCrawler' });
        if (response && response.success) {
          this.stopCrawler();
        } else {
          throw new Error('停止爬虫失败');
        }
      }
    } catch (error) {
      console.error('Toggle crawler error:', error);
      let errorMessage = '错误: ';
      if (error.message.includes('Could not establish connection')) {
        errorMessage += '无法连接到页面，请刷新页面后重试';
      } else if (error.message.includes('Cannot access')) {
        errorMessage += '无法访问此页面';
      } else {
        errorMessage += error.message;
      }
      this.updateStatusDisplay(errorMessage, 'inactive');
    }
  }

  async checkConnection(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      return response && response.success;
    } catch (error) {
      return false;
    }
  }

  async injectContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      console.log('Content script injected successfully');
    } catch (error) {
      console.error('Failed to inject content script:', error);
      throw new Error('无法注入脚本，请检查页面权限');
    }
  }

  startCrawler() {
    this.isRunning = true;
    this.startTime = Date.now();
    this.toggleBtn.textContent = '停止爬虫';
    this.toggleBtn.className = 'toggle-btn stop-btn';
    this.updateStatusDisplay('爬虫运行中...', 'working');
    
    // 开始计时器
    this.timer = setInterval(() => this.updateRunTime(), 1000);
  }

  stopCrawler() {
    this.isRunning = false;
    this.toggleBtn.textContent = '开始爬虫';
    this.toggleBtn.className = 'toggle-btn start-btn';
    this.updateStatusDisplay('爬虫已停止', 'inactive');
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  updateStatusDisplay(text, className) {
    this.status.textContent = text;
    this.status.className = `status ${className}`;
  }

  updateRunTime() {
    if (this.startTime) {
      const elapsed = Date.now() - this.startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      this.runTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  async updateStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检测tab切换
      if (this.lastTabId && this.lastTabId !== tab.id) {
        console.log('检测到tab切换，从', this.lastTabId, '到', tab.id);
        // 检查全局状态
        await this.checkGlobalState();
      }
      this.lastTabId = tab.id;
      
      // 检查是否在雪球网站
      if (!tab.url || !tab.url.includes('xueqiu.com')) {
        this.updateStatusDisplay('请在雪球网站上使用', 'inactive');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
      
      if (response) {
        this.itemCount.textContent = response.itemCount || 0;
        this.pageCount.textContent = response.pageCount || 0;
        
        // 更新下载按钮状态
        this.downloadBtn.disabled = (response.itemCount || 0) === 0;
        
        // 同步爬虫状态
        if (response.isRunning !== this.isRunning) {
          if (response.isRunning) {
            this.startCrawler();
          } else {
            this.stopCrawler();
          }
        }
      } else {
        // 如果无法获取状态，检查是否需要注入脚本
        const isConnected = await this.checkConnection(tab.id);
        if (!isConnected) {
          this.updateStatusDisplay('点击开始按钮初始化', 'inactive');
        }
      }
    } catch (error) {
      // 页面可能还没有加载content script，或者不在雪球网站，忽略错误
      this.updateStatusDisplay('等待页面加载...', 'inactive');
    }
  }

  async downloadData() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'exportData' });
      
      if (response && response.data) {
        this.downloadJSON(response.data, 'xueqiu_data.json');
      }
    } catch (error) {
      console.error('Download data error:', error);
    }
  }

  async resetData() {
    try {
      // 确认操作
      if (!confirm('确定要重置所有已存储的数据吗？此操作不可恢复！')) {
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查是否在雪球网站
      if (!tab.url || !tab.url.includes('xueqiu.com')) {
        alert('请在雪球网站上使用此功能');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'resetData' });
      
      if (response && response.success) {
        // 重置UI显示
        this.itemCount.textContent = '0';
        this.pageCount.textContent = '0';
        this.downloadBtn.disabled = true;
        
        // 显示成功消息
        this.updateStatusDisplay('数据已重置', 'inactive');
        setTimeout(() => {
          this.updateStatus(); // 恢复正常状态显示
        }, 2000);
      } else {
        alert('重置数据失败，请重试');
      }
    } catch (error) {
      console.error('Reset data error:', error);
      alert('重置数据时发生错误');
    }
  }

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// 初始化弹窗控制器
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
