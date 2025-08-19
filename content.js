// content.js - 主要的爬虫逻辑
class XueqiuCrawler {
  constructor() {
    this.isRunning = false;
    this.collectedData = [];
    this.currentPage = 0;

    this.init();
  }

  init() {
    console.log("雪球爬虫工具已加载");

    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 保持消息通道开放
    });

    // 恢复之前的状态
    this.restoreState();

    // 监听页面可见性变化，确保状态同步
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.syncState();
      }
    });

    // 页面获得焦点时同步状态
    window.addEventListener("focus", () => {
      this.syncState();
    });
  }

  // 同步状态（当页面重新获得焦点时）
  async syncState() {
    try {
      const result = await chrome.storage.local.get(["crawlerState"]);
      if (result.crawlerState) {
        const state = result.crawlerState;
        const currentTime = Date.now();

        // 检查状态是否有效（5分钟内）
        if (currentTime - state.lastUpdate < 5 * 60 * 1000) {
          // 如果当前页面未在运行但存储状态显示在运行
          if (!this.isRunning && state.isRunning) {
            console.log("检测到其他tab的爬虫状态，同步中...");
            this.isRunning = state.isRunning;
            this.collectedData = state.collectedData || [];
            this.currentPage = state.currentPage || 0;
          }
        }
      }
    } catch (error) {
      console.error("同步状态失败:", error);
    }
  }

  // 保存状态到Chrome存储
  async saveState() {
    try {
      const state = {
        isRunning: this.isRunning,
        collectedData: this.collectedData,
        currentPage: this.currentPage,
        lastUpdate: Date.now(),
      };
      await chrome.storage.local.set({ crawlerState: state });
      console.log("爬虫状态已保存");
    } catch (error) {
      console.error("保存状态失败:", error);
    }
  }

  // 从Chrome存储恢复状态
  async restoreState() {
    try {
      const result = await chrome.storage.local.get(["crawlerState"]);
      if (result.crawlerState) {
        const state = result.crawlerState;
        // 只有在最近5分钟内保存的状态才恢复
        if (Date.now() - state.lastUpdate < 5 * 60 * 1000) {
          this.isRunning = state.isRunning;
          this.collectedData = state.collectedData || [];
          this.currentPage = state.currentPage || 0;
          console.log(
            `状态已恢复: 运行中=${this.isRunning}, 数据=${this.collectedData.length}条`
          );

          // 如果之前在运行中，重新启动爬虫
          if (this.isRunning) {
            console.log("检测到之前运行状态，重新启动爬虫...");
            setTimeout(() => {
              this.resumeCrawling();
            }, 1000);
          }
        } else {
          console.log("状态已过期，不恢复");
          this.clearState();
        }
      }
    } catch (error) {
      console.error("恢复状态失败:", error);
    }
  }

  // 清除保存的状态
  async clearState() {
    try {
      await chrome.storage.local.remove(["crawlerState"]);
      console.log("状态已清除");
    } catch (error) {
      console.error("清除状态失败:", error);
    }
  }

  // 恢复爬虫运行
  async resumeCrawling() {
    console.log("恢复爬虫运行...");
    try {
      // 开始爬取循环
      await this.crawlLoop();
    } catch (error) {
      console.error("恢复爬虫失败:", error);
      this.stopCrawler();
    }
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case "ping":
        sendResponse({ success: true, message: "Content script is loaded" });
        break;

      case "startCrawler":
        await this.startCrawler();
        sendResponse({ success: true });
        break;

      case "stopCrawler":
        this.stopCrawler();
        sendResponse({ success: true });
        break;

      case "getStatus":
        sendResponse({
          isRunning: this.isRunning,
          itemCount: this.collectedData.length,
          pageCount: this.currentPage,
        });
        break;

      case "exportData":
        sendResponse({
          data: {
            collectedAt: new Date().toISOString(),
            totalItems: this.collectedData.length,
            data: this.collectedData,
          },
        });
        break;

      case "resetData":
        await this.resetData();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: "Unknown action" });
    }
  }

  async startCrawler() {
    console.log("开始启动雪球爬虫...");

    if (this.isRunning) {
      console.log("爬虫已在运行中");
      return;
    }

    this.isRunning = true;
    await this.saveState(); // 保存启动状态

    try {
      // 首先点击timeline tab的第二个a标签
      await this.clickTimelineTab();

      // 开始爬取循环
      await this.crawlLoop();
    } catch (error) {
      console.error("启动爬虫失败:", error);
      this.stopCrawler();
    }
  }

  async clickTimelineTab() {
    console.log("开始查找timeline tab元素...");

    // 查找timeline tab的第二个a标签
    const timelineTabs = document.querySelectorAll(".timeline__tab__tags a");

    if (timelineTabs.length >= 2) {
      const secondTab = timelineTabs[1];
      console.log("找到timeline tab，准备点击:", secondTab.textContent);

      secondTab.click();
      
      // 点击tab后就算第一页了
      this.currentPage = 1;

      // 等待页面加载
      await this.wait(3000);
    } else {
      console.warn("未找到timeline tab标签");
    }
  }

  async crawlLoop() {
    console.log("开始爬取循环...");

    while (this.isRunning) {
      try {
        // 获取当前页面的动态数据
        const pageData = await this.scrapePage();

        if (pageData.length > 0) {
          console.log(
            `成功爬取第 ${this.currentPage} 页，${pageData.length} 条数据`
          );
          this.collectedData.push(...pageData);
          await this.saveState(); // 保存数据更新状态
        } else {
          console.log("当前页面没有找到数据");
        }
        // await this.wait(1000);
        // 尝试翻页到下一页
        const hasNextPage = await this.tryNextPage();
        if (!hasNextPage) {
          console.log("没有更多页面，爬取完成");
          break;
        }
      } catch (error) {
        console.error("爬取过程中出错:", error);
        break;
      }
    }

    this.stopCrawler();
  }

  async scrapePage() {
    console.log("开始抓取当前页面数据...");

    const items = [];

    // 查找页面上的动态元素
    const timelineItems = document.querySelectorAll(".timeline__item");

    // 首先点击所有的展开按钮
    console.log(
      `找到 ${timelineItems.length} 个timeline项，开始点击展开按钮...`
    );
    timelineItems.forEach((item, index) => {
      try {
        const expandButton = item.querySelector(
          ".timeline__item__content a.timeline__expand__control"
        );
        if (expandButton) {
          console.log(`点击第 ${index + 1} 个item的展开按钮`);
          expandButton.click();
        }
      } catch (error) {
        console.error(`点击第 ${index + 1} 个item展开按钮时出错:`, error);
      }
    });

    // 等待展开动画完成
    console.log("等待展开动画完成...");
    const waitTime = Math.min(timelineItems.length * 100, 2000); // 最多等待2秒
    await this.wait(waitTime);
    console.log("展开完成，开始提取数据");

    // 提取展开后的数据
    timelineItems.forEach((item, index) => {
      try {
        // 优先查找展开后的内容
        let textElement = item.querySelector(
          ".timeline__item__content .content--detail"
        );
        // 如果没有展开内容，回退到原始内容
        if (!textElement) {
          textElement = item.querySelector(".timeline__item__content");
        }

        const userElement = item.querySelector(
          ".timeline__item__header .user-name"
        );
        const timeElement = item.querySelector(".timeline__item__time");

        if (textElement) {
          const itemData = {
            id: `page_${this.currentPage}_item_${index}`,
            text: textElement.textContent?.trim() || "",
            user: userElement?.textContent?.trim() || "",
            time: timeElement?.textContent?.trim() || "",
            pageNumber: this.currentPage, // 直接使用currentPage，不用+1
            timestamp: new Date().toISOString(),
            isExpanded: !!item.querySelector(".content--detail"), // 标记是否成功展开
          };

          items.push(itemData);
          console.log(
            `提取第 ${index + 1} 个item: ${
              itemData.isExpanded ? "已展开" : "未展开"
            }`
          );
        }
      } catch (error) {
        console.error("处理单个item时出错:", error);
      }
    });

    console.log(
      `从页面提取了 ${items.length} 个条目，其中 ${
        items.filter((item) => item.isExpanded).length
      } 个已展开`
    );
    return items;
  }

  async tryNextPage() {
    console.log("尝试查找下一页按钮...");

    // 查找下一页按钮
    const nextButton = document.querySelector(
      "div.profiles__main.enterprise__main > div.pagination > a.pagination__next:not([style*='display: none'])"
    );

    if (nextButton) {
      console.log("找到下一页按钮，准备点击");
      nextButton.click();

      this.currentPage++;

      // 等待页面加载
      await this.wait(3000);

      return true;
    } else {
      console.log("没有找到可用的下一页按钮");
      return false;
    }
  }

  stopCrawler() {
    console.log("停止雪球爬虫");
    this.isRunning = false;
    console.log(`总共收集了 ${this.collectedData.length} 条数据`);
    this.saveState(); // 保存停止状态
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async resetData() {
    console.log("重置所有存储数据...");
    try {
      // 停止当前运行的爬虫
      if (this.isRunning) {
        this.isRunning = false;
      }

      // 清空内存中的数据
      this.collectedData = [];
      this.currentPage = 0;

      // 清除Chrome存储中的状态
      await this.clearState();

      console.log("数据重置完成");
      return true;
    } catch (error) {
      console.error("重置数据失败:", error);
      return false;
    }
  }
}

// 初始化爬虫
const crawler = new XueqiuCrawler();
