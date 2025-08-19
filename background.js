// background.js - 后台脚本（网络拦截版本）
class BackgroundService {
  constructor() {
    this.init();
  }

  init() {
    console.log('雪球爬虫后台服务已启动（网络拦截模式）');
    
    // 监听扩展安装/启动
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('扩展已安装/更新:', details.reason);
      this.initializeStorage();
    });

    // 设置网络请求监听器
    this.setupWebRequestListeners();

    // 监听标签页更新
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url?.includes('xueqiu.com')) {
        console.log('雪球页面加载完成:', tab.url);
      }
    });

    // 监听消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
  }

  setupWebRequestListeners() {
    // 监听网络请求
    if (chrome.webRequest && chrome.webRequest.onCompleted) {
      chrome.webRequest.onCompleted.addListener(
        (details) => {
          if (details.url.includes('/v4/statuses/user_timeline.json')) {
            console.log('后台检测到时间线API请求:', details.url);
            console.log('请求详情:', details);
          }
        },
        {
          urls: ["*://*.xueqiu.com/*"]
        }
      );
    }

    // 监听请求开始
    if (chrome.webRequest && chrome.webRequest.onBeforeRequest) {
      chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
          if (details.url.includes('/v4/statuses/user_timeline.json')) {
            console.log('时间线API请求开始:', details.url);
          }
        },
        {
          urls: ["*://*.xueqiu.com/*"]
        }
      );
    }
  }

  initializeStorage() {
    chrome.storage.local.set({
      autoStart: false,
      lastCrawlTime: null,
      totalItemsCollected: 0,
      totalApiResponses: 0
    });
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'saveData':
        this.saveData(request.data);
        sendResponse({ success: true });
        break;
        
      case 'loadData':
        this.loadData().then(data => {
          sendResponse({ success: true, data });
        });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  async saveData(data) {
    try {
      await chrome.storage.local.set({
        crawlData: data,
        lastCrawlTime: Date.now(),
        totalItemsCollected: data.length
      });
      console.log('数据已保存到本地存储');
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  }

  async loadData() {
    try {
      const result = await chrome.storage.local.get(['crawlData']);
      return result.crawlData || [];
    } catch (error) {
      console.error('加载数据失败:', error);
      return [];
    }
  }
}

// 初始化后台服务
new BackgroundService();
