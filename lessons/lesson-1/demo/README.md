# Demo 聊天助手

这是一个用于教学的简化聊天应用。它演示了前端和后端是如何协作的。

## 项目结构

```
lesson-demo/
├── client/          ← 前端代码（跑在浏览器里）
│   ├── src/
│   │   ├── main.tsx          启动文件
│   │   ├── App.tsx           根组件，管理消息状态
│   │   ├── api.ts            调后端接口的函数
│   │   ├── styles.css        页面样式
│   │   └── components/
│   │       ├── ChatWindow.tsx    消息列表
│   │       ├── MessageBubble.tsx 消息气泡
│   │       └── ChatInput.tsx     输入框
│   ├── index.html     HTML 入口
│   ├── package.json   前端依赖
│   ├── tsconfig.json  TypeScript 配置
│   └── vite.config.ts 打包工具配置
│
├── server/          ← 后端代码（跑在你的电脑上）
│   ├── index.ts       服务器入口 + API 路由
│   ├── replies.ts     模拟回复数据
│   ├── package.json   后端依赖
│   └── tsconfig.json  TypeScript 配置
│
└── README.md        ← 你正在看的这个文件
```

## 如何启动

需要先安装 [Node.js](https://nodejs.org/)（LTS 版本）。

### 第 1 步：启动后端

打开一个终端窗口：

```bash
cd server
npm install
npm run dev
```

看到 "后端服务器已启动" 就说明成功了。

### 第 2 步：启动前端

打开**另一个**终端窗口：

```bash
cd client
npm install
npm run dev
```

看到 Local: http://localhost:5173 就说明成功了。

### 第 3 步：打开浏览器

访问 http://localhost:5173 ，就能看到聊天页面了。

## 试试这些操作

1. 按 `F12` 打开 Chrome DevTools
2. 切到 **Network** 面板，刷新页面，看看有哪些请求
3. 发一条消息，观察 Network 面板里新出现的请求
4. 切到 **Console** 面板，看看日志输出
5. 切到 **Elements** 面板，找到消息气泡对应的 HTML
