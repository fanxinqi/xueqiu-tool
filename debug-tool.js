// 调试工具 - 在浏览器控制台中运行这些代码来诊断问题

console.log('=== 雪球爬虫调试工具 ===');

// 1. 检查页面基本信息
console.log('页面URL:', window.location.href);
console.log('页面标题:', document.title);
console.log('用户代理:', navigator.userAgent);

// 2. 检查是否加载了content script
console.log('Content Script加载状态:', typeof window.xueqiuCrawler !== 'undefined');
if (window.xueqiuCrawler) {
  console.log('爬虫运行状态:', window.xueqiuCrawler.isRunning);
  console.log('已收集数据:', window.xueqiuCrawler.collectedData.length);
  console.log('当前页数:', window.xueqiuCrawler.currentPage);
}

// 3. 检查timeline tab元素
console.log('\n=== Timeline Tab 检查 ===');
const timelineSelectors = [
  '.timeline__tab__tags a',
  '.timeline__tab a', 
  '[class*="timeline"] a',
  '.tab a',
  '.tabs a'
];

timelineSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  console.log(`${selector}: ${elements.length} 个元素`);
  if (elements.length > 0) {
    elements.forEach((el, index) => {
      console.log(`  ${index}: "${el.textContent?.trim()}" href="${el.href}"`);
    });
  }
});

// 4. 检查分页按钮
console.log('\n=== 分页按钮检查 ===');
const paginationSelectors = [
  '.pagination__next',
  '.pagination .next',
  '.page-next',
  '.next-page',
  'a[class*="next"]',
  'button[class*="next"]'
];

paginationSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  console.log(`${selector}: ${elements.length} 个元素`);
  if (elements.length > 0) {
    elements.forEach((el, index) => {
      console.log(`  ${index}: "${el.textContent?.trim()}" disabled=${el.disabled} class="${el.className}"`);
    });
  }
});

// 5. 检查网络请求拦截
console.log('\n=== 网络拦截检查 ===');
console.log('XMLHttpRequest已拦截:', XMLHttpRequest.prototype.send.toString().includes('timeline'));
console.log('Fetch已拦截:', window.fetch.toString().includes('timeline'));

// 6. 手动测试API请求
console.log('\n=== 手动API测试 ===');
const testUrls = [
  '/v4/statuses/user_timeline.json',
  '/v4/statuses/user_timeline.json?page=1',
  '/statuses/user_timeline.json'
];

testUrls.forEach(async (url) => {
  try {
    const response = await fetch(url);
    console.log(`${url}: 状态 ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`${url}: 返回数据长度 ${JSON.stringify(data).length}`);
    }
  } catch (error) {
    console.log(`${url}: 错误 ${error.message}`);
  }
});

// 7. 检查页面内容
console.log('\n=== 页面内容检查 ===');
const contentSelectors = [
  '.profiles__timeline__bd',
  'article.timeline__item',
  '[class*="timeline"]',
  '[class*="feed"]',
  '[class*="status"]'
];

contentSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  console.log(`${selector}: ${elements.length} 个元素`);
});

console.log('\n=== 调试工具运行完成 ===');
console.log('如果发现问题，请将以上信息发送给开发者');

// 导出调试函数
window.debugXueqiuCrawler = {
  checkElements: () => {
    console.log('Timeline tabs:', document.querySelectorAll('.timeline__tab__tags a'));
    console.log('Pagination:', document.querySelectorAll('.pagination__next'));
    console.log('Content items:', document.querySelectorAll('article.timeline__item'));
  },
  
  testNetworkInterception: () => {
    console.log('测试网络拦截...');
    fetch('/v4/statuses/user_timeline.json?test=1')
      .then(response => console.log('测试请求响应:', response))
      .catch(error => console.log('测试请求失败:', error));
  },
  
  manualStart: () => {
    if (window.xueqiuCrawler) {
      window.xueqiuCrawler.startCrawler();
    } else {
      console.log('Content script未加载');
    }
  }
};

console.log('调试函数已加载到 window.debugXueqiuCrawler');
console.log('可以使用:');
console.log('  debugXueqiuCrawler.checkElements()');
console.log('  debugXueqiuCrawler.testNetworkInterception()');
console.log('  debugXueqiuCrawler.manualStart()');
