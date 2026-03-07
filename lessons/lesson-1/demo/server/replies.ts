/**
 * 模拟回复数据
 *
 * 根据用户消息中的关键词匹配回复，
 * 没匹配到就随机选一条通用回复。
 */

interface ReplyRule {
  keywords: string[];
  reply: string;
}

// 关键词匹配规则（按优先级排列）
const rules: ReplyRule[] = [
  {
    keywords: ["你好", "hi", "hello", "嗨"],
    reply: "你好呀！很高兴见到你，有什么想聊的吗？",
  },
  {
    keywords: ["名字", "你是谁", "你叫什么"],
    reply: "我是 Demo 助手，一个用来教学的简单聊天机器人。我的代码就在这个项目里，你可以打开看看我是怎么工作的！",
  },
  {
    keywords: ["天气"],
    reply: "我没有联网功能，查不了天气哦。不过你可以打开 DevTools 的 Network 面板，看看我们之间的请求长什么样！",
  },
  {
    keywords: ["代码", "编程", "开发"],
    reply: "说到代码，你现在看到的这个聊天页面就是用 React 写的前端 + Express 写的后端。前端跑在浏览器里，后端跑在你的电脑上。",
  },
  {
    keywords: ["前端", "浏览器"],
    reply: "前端代码在 client/ 文件夹里，它们会被发送到浏览器执行。你可以在 DevTools 的 Elements 面板里看到它们生成的 HTML。",
  },
  {
    keywords: ["后端", "服务器", "server"],
    reply: "后端代码在 server/ 文件夹里，它跑在你的电脑上（就是那个终端窗口里）。浏览器通过 HTTP 请求跟它通信。",
  },
  {
    keywords: ["api", "接口", "请求"],
    reply: "每次你发消息，前端都会发一个 POST 请求到 /api/chat。你可以在 Network 面板里看到这个请求的详细信息——包括你发了什么、我回了什么。",
  },
  {
    keywords: ["谢谢", "感谢", "thanks"],
    reply: "不客气！继续探索吧，试试打开 DevTools 看看我们之间的通信过程。",
  },
];

// 通用回复（没匹配到关键词时随机选一条）
const genericReplies: string[] = [
  "有意思！你可以试试打开 Chrome DevTools（按 F12），看看 Network 面板里我们的对话请求。",
  "收到！顺便说一句，你发的每条消息都是一个 HTTP 请求，后端收到后再返回我的回复。",
  "好的！你知道吗，这个页面的 HTML 结构可以在 DevTools 的 Elements 面板里看到。",
  "嗯嗯！试试在 Console 面板里输入 document.title，看看会返回什么？",
  "我听到了！这条回复是从后端服务器返回的 JSON 数据，前端把它渲染成了你看到的气泡样式。",
];

/**
 * 根据用户消息生成回复
 */
export function getReply(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  for (const rule of rules) {
    if (rule.keywords.some((kw) => msg.includes(kw))) {
      return rule.reply;
    }
  }

  // 随机选一条通用回复
  const index = Math.floor(Math.random() * genericReplies.length);
  return genericReplies[index];
}
