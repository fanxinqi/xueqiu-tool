# 调试指南

## 常见问题及解决方案

### 1. "Could not establish connection. Receiving end does not exist" 错误

**原因**: Content script 未正确加载到页面中

**解决方案**:
1. 确保在雪球网站 (xueqiu.com) 上使用插件
2. 刷新页面后重试
3. 检查扩展是否已正确安装并有权限

### 2. 插件按钮无响应

**解决方案**:
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签页的错误信息
3. 尝试刷新页面
4. 重新安装插件

### 3. 无法捕获 API 响应

**检查步骤**:
1. 确认页面上有 `timeline__tab__tags` 元素
2. 打开 Network 标签页，查看是否有 `/v4/statuses/user_timeline.json` 请求
3. 检查控制台是否有网络拦截相关的日志

### 4. 权限问题

**解决方案**:
1. 在 `chrome://extensions/` 中删除旧版本
2. 重新加载插件
3. 确认新权限请求

## 调试步骤

### 1. 检查插件是否正确安装
```
1. 打开 chrome://extensions/
2. 确认"雪球数据爬虫工具"已启用
3. 检查版本号是否正确
```

### 2. 检查页面环境
```
1. 确认在 xueqiu.com 域名下
2. 打开开发者工具
3. 在 Console 中输入: window.xueqiuCrawler
4. 应该看到 crawler 对象
```

### 3. 手动测试连接
```javascript
// 在页面控制台中执行
chrome.runtime.sendMessage({action: 'ping'}, (response) => {
  console.log('Connection test:', response);
});
```

### 4. 检查网络拦截
```javascript
// 在页面控制台中检查拦截器是否设置
console.log('XMLHttpRequest patched:', XMLHttpRequest.prototype.send.toString().includes('timeline'));
console.log('Fetch patched:', window.fetch.toString().includes('timeline'));
```

## 日志说明

### 正常启动日志
```
雪球爬虫工具已加载（网络拦截模式）
网络请求拦截器已设置
启动雪球爬虫（网络拦截模式）...
点击timeline第二个tab: [tab名称]
等待API响应...
```

### API拦截日志
```
拦截到时间线API响应: [API URL]
响应数据: [数据对象]
成功处理API响应，提取到 [数量] 个条目
总计已收集 [数量] 个API响应
```

## 手动测试脚本

在浏览器控制台中运行以下代码来测试功能：

```javascript
// 测试1: 检查元素是否存在
console.log('Timeline tabs:', document.querySelectorAll('.timeline__tab__tags a'));
console.log('Next button:', document.querySelector('.pagination__next'));

// 测试2: 检查爬虫状态
if (window.xueqiuCrawler) {
  console.log('Crawler loaded:', window.xueqiuCrawler);
  console.log('Is running:', window.xueqiuCrawler.isRunning);
  console.log('Collected data:', window.xueqiuCrawler.collectedData.length);
} else {
  console.log('Crawler not loaded');
}

// 测试3: 手动触发API请求
fetch('/v4/statuses/user_timeline.json?page=1')
  .then(response => response.json())
  .then(data => console.log('Manual API test:', data))
  .catch(error => console.error('API test failed:', error));
```

## 联系支持

如果问题仍然存在，请提供以下信息：
1. Chrome 版本
2. 插件版本
3. 完整的控制台错误信息
4. 重现步骤
