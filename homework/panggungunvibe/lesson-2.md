## 任务1：找到入口文件

我先打开了 `client/index.html`，看到里面有这句：

```html
<script type="module" src="/src/main.tsx"></script>

这说明前端页面会加载 src/main.tsx。
接着我查看了 src/main.tsx，发现它会把 App 组件渲染到 HTML 里的 #root 元素中：

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

所以我判断这个项目的前端入口文件是：

client/src/main.tsx

这个入口文件的作用是：启动整个前端应用，找到 index.html 中的 #root 节点，并把根组件 App 渲染进去，同时引入全局样式文件 styles.css。


## 任务2：画出组件树

我从入口文件 main.tsx 出发，看到它导入并渲染了根组件 App。
然后查看 App.tsx 的 return，发现它使用了 ChatWindow 和 ChatInput。
接着查看 ChatWindow.tsx，发现它内部又使用了 MessageBubble 来渲染每条消息。
ChatInput.tsx 内部没有再使用其他 React 子组件，只包含输入框和发送按钮。

组件树如下：
App（根组件：管理消息状态、加载状态、请求逻辑）
├── header（展示：页面标题 Demo 聊天助手）
├── ChatWindow（展示：聊天窗口、消息列表、加载中状态）
│   └── MessageBubble（展示：单条消息气泡）
└── ChatInput（交互：输入消息、回车/点击发送）
各组件职责如下：
1、App：管理整个页面的状态和核心逻辑，包括欢迎语获取、消息列表更新、发送消息到后端、处理加载状态。
2、ChatWindow：负责显示所有聊天消息，并在新消息出现时自动滚动到底部；在等待回复时显示加载中的提示。
3、MessageBubble：负责显示单条聊天消息。
4、ChatInput：负责接收用户输入，支持点击按钮发送和按回车发送。


## 任务3：追踪一条数据流

我选择追踪的用户交互是：
用户在聊天页面输入“你是谁”，然后点击发送按钮。

第一步
用户在 ChatInput 组件里输入“你是谁”，并点击发送按钮。
对应文件：
client/src/components/ChatInput.tsx

第二步
点击发送按钮会触发 ChatInput.tsx 里的 handleSubmit 函数。
按钮代码是 onClick={handleSubmit}。
handleSubmit 会读取输入框里的 text，去掉首尾空格后，调用 onSend(trimmed)。

第三步
这个 onSend 是父组件 App 传进来的，实际对应的是 client/src/App.tsx 里的 handleSend。
在 App.tsx 里可以看到：
<ChatInput onSend={handleSend} disabled={loading} />
所以用户点击发送后，真正触发的是 handleSend(text)。

第四步
App.tsx 里的 handleSend 先做了两件事：
1、把用户输入“你是谁”组装成一条 userMsg
2、用 setMessages 把这条消息加入 messages
所以这时候页面会先显示右侧用户消息气泡。
同时它还会执行 setLoading(true)，表示正在等待后端回复。

第五步
handleSend 接着调用了 client/src/api.ts 里的 sendMessage(text)。
这个函数会向后端发送一个 HTTP 请求：
1、请求地址：POST /api/chat
2、请求体：{ message: "你是谁" }
也就是说，前端把用户输入的内容发给了后端。


第六步
后端在 server/index.ts 里定义了这个接口：
app.post("/api/chat", ...)
所以这个请求会被 server/index.ts 中的 /api/chat 路由接住。

第七步
在 server/index.ts 的 /api/chat 里，后端会：
1、从 req.body 中取出 message
2、调用 getReply(message) 生成回复，这个函数来自 server/replies.js
3、生成当前时间 timestamp
4、把用户消息和 AI 回复都存进 chatHistory
5、经过一个 500ms 的延迟后，返回 JSON 数据给前端

第八步
前端 client/src/api.ts 的 sendMessage 收到后端返回后，会把 reply 和 timestamp 返回给 App.tsx 的 handleSend。

第九步
App.tsx 里的 handleSend 拿到回复后，会把 AI 回复组装成 assistantMsg，再用 setMessages 把这条 AI 消息加入 messages。
然后执行 setLoading(false)，结束加载状态。

第十步
messages 更新后，App 重新渲染，并把新的 messages 传给 ChatWindow。
ChatWindow 会遍历 messages，并把每一条消息交给 MessageBubble 来显示。

第十一步
MessageBubble 把新的 AI 回复渲染到页面上，最终用户就在左侧看到了 AI 的回答。
同时 ChatWindow 里的 useEffect 会让页面自动滚动到底部。