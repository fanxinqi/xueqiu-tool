# Chrome 插件安装和使用指南

## 快速安装步骤

### 1. 准备工作
- 确保您使用的是 Chrome 浏览器（版本 88+）
- 确保所有文件都在 `/Users/fanxinqi/Documents/xueqiu-tool` 目录下

### 2. 加载插件
1. 打开 Chrome 浏览器
2. 在地址栏输入：`chrome://extensions/`
3. 打开右上角的"开发者模式"开关
4. 点击左上角的"加载已解压的扩展程序"按钮
5. 选择项目文件夹：`/Users/fanxinqi/Documents/xueqiu-tool`
6. 点击"选择"按钮

### 3. 验证安装
- 插件列表中应该出现"雪球数据爬虫工具"
- Chrome 工具栏中会出现插件图标（如果没有图标，会显示默认图标）

## 详细使用说明

### 步骤 1: 访问雪球网站
打开浏览器，访问 `https://xueqiu.com` 并登录您的账户

### 步骤 2: 导航到目标页面
确保页面上有以下元素：
- `timeline__tab__tags` 类的容器，其中包含 a 标签
- `div.profiles__timeline__bd` 容器
- `article.timeline__item` 列表项
- `pagination__next` 下一页按钮

### 步骤 3: 启动爬虫
1. 点击 Chrome 工具栏中的插件图标
2. 在弹出的面板中点击"开始爬虫"按钮
3. 插件会自动开始工作

### 步骤 4: 监控进度
在插件面板中可以看到：
- 当前状态（运行中/已停止）
- 已采集条目数量
- 当前页数
- 运行时间

### 步骤 5: 导出数据
1. 等待爬虫完成或手动停止
2. 点击"下载数据"按钮
3. 数据会以 JSON 格式下载到默认下载文件夹

## 工作原理

### 自动化流程
1. **点击 Timeline Tab**: 自动点击 `timeline__tab__tags` 的第二个 a 标签
2. **等待加载**: 等待页面内容重新渲染
3. **数据提取**: 从 `div.profiles__timeline__bd` 容器中提取所有 `article.timeline__item`
4. **翻页**: 点击 `.pagination__next` 按钮进入下一页
5. **重复**: 重复步骤 2-4 直到没有更多页面

### 数据提取内容
每个 timeline item 会提取：
- 文本内容
- 链接信息
- 图片信息
- 时间戳
- 用户信息
- 完整的 HTML 结构

## 故障排除

### 插件无法加载
- 检查所有文件是否存在
- 确认 manifest.json 格式正确
- 刷新扩展程序页面后重试

### 爬虫无法启动
- 确保在正确的雪球页面上
- 检查页面是否包含目标元素
- 打开开发者工具查看控制台错误信息

### 数据采集不完整
- 检查网络连接
- 确认页面加载完整
- 调整等待时间（在 content.js 中修改延迟时间）

### 权限问题
- 确保插件有 "activeTab" 权限
- 重新安装插件
- 检查 Chrome 的隐私设置

## 高级配置

### 修改等待时间
在 `content.js` 中找到 `wait()` 函数调用，可以调整等待时间：

```javascript
// 等待页面加载
await this.wait(3000); // 3秒，可以根据网络状况调整
```

### 自定义数据提取
在 `extractItemData` 方法中添加您需要的字段：

```javascript
// 提取自定义内容
const customElement = item.querySelector('.your-custom-class');
if (customElement) {
  data.content.customField = customElement.textContent?.trim();
}
```

### 调试模式
打开 Chrome 开发者工具，查看 Console 标签页可以看到详细的运行日志。

## 安全提醒

- 仅在您有权限的页面上使用此工具
- 遵守网站的使用条款和爬虫协议
- 不要过于频繁地请求数据
- 妥善保管采集到的数据
