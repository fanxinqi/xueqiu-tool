# 网络监控日志说明

## 日志图标含义

- 🚀 **启动/初始化**
- 🔧 **配置/设置** 
- 📡 **网络请求发起**
- 🎯 **匹配到目标API**
- ➡️ **非目标请求**
- 📨 **响应接收**
- ✅ **成功操作**
- ⚠️ **警告**
- ❌ **错误**
- 📊 **数据分析**
- 🔄 **数据处理**
- 📋 **结构分析**
- 📝 **数据提取**
- 🏁 **完成**
- ⏳ **等待**
- 🔍 **查找/搜索**
- 🧹 **清理**

## 关键日志说明

### 1. 插件加载
```
🚀 雪球爬虫工具已加载（网络拦截模式）
   - 页面URL: [当前页面]
   - 页面标题: [页面标题]
```

### 2. 网络拦截器设置
```
🔧 开始设置网络请求拦截器...
✅ 网络请求拦截器已设置完成
🔍 监控的API模式:
   - /v4/statuses/user_timeline.json
   - 包含 "timeline" 的URL
   - 包含 "statuses" 的URL
   - 包含 "user_timeline" 的URL
```

### 3. 网络请求监控
```
📡 XHR Open: GET https://example.com/api
🚀 XHR Send: https://example.com/api
🎯 匹配到时间线相关请求 (XHR): [URL]
   - 请求方法: GET
   - 完整URL: [完整URL]
```

### 4. API响应接收
```
📨 XHR 响应接收: [URL]
   - 响应状态: 200
   - 响应头: [响应头信息]
   - 响应文本长度: 1234
✅ XHR JSON解析成功
   - 数据类型: object
   - 数据键: ['statuses', 'next_cursor', 'previous_cursor']
   - 完整响应数据: [数据对象]
```

### 5. 数据处理
```
🎯 开始处理时间线API响应
   - URL: [API URL]
   - 爬虫运行状态: true
✅ 新请求，开始处理
🔄 开始处理时间线数据
📋 分析响应数据结构:
   - 数据类型: object
   - 是否为对象: true
   - 是否为数组: false
   - 数据键: ['statuses', 'next_cursor']
✅ 找到statuses字段
   - statuses类型: object
   - statuses长度: 20
📝 提取的条目示例: [第一个条目]
✅ 数据处理完成
   - 本次提取条目: 20 个
   - 总计API响应: 1 个
   - 总计条目数: 20 个
```

## 故障排除指南

### 如果看不到目标API请求
- 检查是否有 `🎯 匹配到时间线相关请求` 日志
- 如果只有 `➡️ 非目标请求`，说明API URL不匹配
- 查看所有网络请求，找到真正的时间线API

### 如果API请求被拦截但没有数据
- 检查是否有 `📨 响应接收` 日志
- 检查响应状态是否为200
- 查看 `📋 分析响应数据结构` 部分，确认数据格式

### 如果JSON解析失败
- 查看 `❌ 解析时间线响应失败` 错误
- 检查原始响应文本是否为有效JSON
- 可能API返回了HTML或其他格式

### 如果收到HTML而不是JSON响应
- 错误信息：`SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- 查看 `⚠️ 响应是HTML页面，不是JSON API响应` 警告
- 检查 `📄 响应内容预览` 日志查看实际内容
- **解决方案：**
  1. 确保已登录雪球网站
  2. 检查是否被重定向到登录页面
  3. 尝试手动刷新页面
  4. 检查API URL是否正确

### 如果出现body stream already read错误
- 这是因为响应流被多次读取
- 已在新版本中修复，使用response.clone()来避免冲突

### 如果找不到statuses字段
- 查看 `⚠️ 未识别的数据结构` 警告
- 检查响应数据的实际结构
- 查看是否有其他可能的数据字段

## 使用技巧

1. **打开控制台**：按F12 → Console标签页
2. **过滤日志**：在控制台搜索框输入关键词如 "🎯" 只看匹配的请求
3. **导出日志**：右键控制台 → Save as... 保存完整日志
4. **实时监控**：保持控制台打开，观察网络请求实时变化

## 调试命令

在控制台中可以使用以下命令：

```javascript
// 查看当前拦截器状态
console.log('拦截器设置:', window.xueqiuCrawler ? '已设置' : '未设置');

// 查看已收集的数据
if (window.xueqiuCrawler) {
  console.log('收集的数据:', window.xueqiuCrawler.collectedData);
}

// 手动触发网络请求测试
fetch('/v4/statuses/user_timeline.json').catch(e => console.log('测试请求:', e));
```
