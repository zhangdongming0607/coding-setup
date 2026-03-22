
1. 找到你项目的入口文件是哪个，截图或写出文件路径
打开demo文件，找到index.html 
可以看到前端启动的文件： <script type="module" src="/src/main.tsx"></script>

2. 从入口文件出发，画出你项目的组件树
从入口进入main.tsx文件，可以看到 引入了 react、react-dom、App组件、以及全局样式文件index.css

然后打开App.tsx文件，这个文件对对话首页进行交互、信息展现的定义，总共3个部分
 第一部分：import 引入了 react相关的内容，以及组件、样式文件，还有一些api的内容
 第二部分：export 进行状态声明并进行行为定义，
    1. 定义messages、Loading 的说明
    2. 行为定义
        1. fetchWelcome：欢迎信息的定义
        2. handleSendMessage：发送消息的定义，
            a. 用户的消息以 role、content、timestamp的形式存在
            b. 等待回复
            c. 回复回来之后，依旧以 role、content、timestamp的形式存在
            d. 如果失败，就展示错误信息
 第三部分：return 页面结构 - 返回页面长什么样子
    1.整个标题为 demo 聊天助手
    2.输入框和发送按钮
    3.存在聊天展示区域 包含了 chatwindow和chatinput 等等组件

打开component文件，进行内容的查看
    1.chatinput ：用来进行聊天信息输入的组件
    2.chatwindow ：页面中整个对话的区域，这个里面引用了messagebubble
    3.messagebubble ： 对话的气泡


3. 挑一个你项目里的用户交互（比如点按钮、提交表单），追踪它的数据流，写出每一步经过了哪个文件、哪个函数
以demo发送消息为例

第一步：用户在页面的，chatinput组件上进行消息输入，引用 （src/components/ChatInput.tsx）文件中的组件

第二步：这个时候用户如果出发onSend之后，就会把信息 触发 App.tsx 文件的handleSend，开始进行处理

第三步：处理时，按照下面的结构，变成 带上role、content、timestamp的一条信息
    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    有了新的信息之后，就会多一个消息，并开始加载
    setMessages((prev) => [...prev, userMsg]); 
    setLoading(true); 

第四步：消息发送给后端，等待回复；对接的文件是 api.ts 以 fetch "/api/chat" 进行处理。
    fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
    
第五步：后端收到这个内容
    在 server/index.ts 文件下 
    app.post("/api/chat", (req, res) => {
  const { message } = req.body as { message: string };
  这里说明了api chat的内容，拿到前端给的输入信息

第六步：正常执行 进入 replies.ts 文件，进行消息生成，获得一条回复massage
 const reply = getReply(message);
  const now = new Date().toISOString();

第七步：前端在api.ts中获得返回的这个信息
const data = (await response.json()) as { reply: string; timestamp: string };

带着这个返回的信息，再次来到 app.tsx 并放到消息列表中，然后 chatwindow 上会多一个 assistantMsg
    const assistantMsg: Message = {
        role: "assistant",
        content: reply,
        timestamp,
      };
      setMessages((prev) => [...prev, assistantMsg]);

第八步：有了这个返回的新消息，需要按在chatwindow中定义展示，
    在消息列表中，如果出现消息，就需要按照 {bottomRef.current?.scrollIntoView({ behavior: "smooth" });}, 进行展示，自动滚到底部
    同时，在chatwindow中，消息需要按照messagebubble展示，这时就引用 messagebubble 里的内容

