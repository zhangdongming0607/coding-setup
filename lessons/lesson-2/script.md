# 第 2 课逐字稿：读代码 — 看懂 AI 写了什么

---

## 0:00-0:05 — 开场 & 回顾

上节课我们搞清楚了一件事——你在浏览器输入网址、按回车，到页面出现，中间是浏览器和服务器在来回传东西。我们还学会了用 DevTools 的 Network 面板去"偷看"这个过程。

今天进入下一步。你们用 AI 写代码，最常遇到的情况是什么？——跑起来了，但不知道它在干嘛。改一个地方，另一个地方崩了，不知道为什么。

这就是因为你没有"读过"那些代码。今天这节课就教一件事：**怎么读代码**。注意，不是"学会写代码"，是学会读。就像你不需要会做菜，但你要能看懂菜单上写的是什么。

而且读代码有方法的，不是从第一行看到最后一行。方法就八个字：**找入口，顺着数据流走**。今天我们用上节课的 Demo 项目来练这个方法。

---

## 0:05-0:15 — 方法论：找入口，顺着数据流走

读代码跟读一本书不一样。书从第一页翻就行了，但代码不是线性的——几十个文件摆在面前，从哪个开始？

方法就两步。

**第一步：找入口。** 每个程序都有一个"最先被执行的文件"，这就是入口。找到它，你就有了起点。

前端项目的入口怎么找？还记得上节课说的吗——浏览器最先拿到的是一个 HTML 文件。所以入口就是 `index.html`。我们打开看一眼。

（打开 `client/index.html`）

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

就这两行关键的。第一行是一个空容器，React 会把整个页面画在这里面。第二行是一个 `script` 标签，浏览器看到它就会去加载 `main.tsx` 来执行。所以——**HTML 是起点，但真正的逻辑从 `main.tsx` 开始**。

以后你拿到任何前端项目，先找 `index.html`，看里面的 `<script>` 标签指向谁，那就是 JS 的入口。

**第二步：顺着数据流走。** 找到入口之后，怎么继续往下读？追踪数据是怎么流动的。什么叫数据流？就是这个过程：

（板书画出来）

```
用户操作（点按钮、打字）
  → 触发一个函数
    → 函数去改数据，或者发请求给后端
      → 数据变了，页面自动更新
```

你读代码的时候，就是在这条线上找你关心的那个环节。比如页面上一个文字显示不对，你就从"页面渲染"往回追——这个文字的数据从哪来的？是前端自己算的，还是后端返回的？一路往上游追，就能找到问题出在哪。

这个方法适用于任何项目，不管它用什么框架。今天我们用上节课的 Demo 项目来练一遍。

---

## 0:15-0:35 — 实战：跟我读一遍 Demo 项目

### 第一步：找入口（0:15-0:20）

打开 VS Code，看 Demo 项目的前端代码——`client` 文件夹。

第一步，找入口。刚才说了，前端的入口是 HTML 文件。打开 `client/index.html`。

（打开 `client/index.html`）

内容很短，关键就两行：

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

第一行，一个空的 `div`，id 叫 `root`。这就是一个空容器——React 会把整个页面画在这个容器里。

第二行，一个 `script` 标签，告诉浏览器"去加载 `/src/main.tsx` 这个文件来执行"。所以 **HTML 是起点，但代码逻辑从 `main.tsx` 开始**。

我们跟过去看。

（打开 `client/src/main.tsx`）

```tsx
createRoot(document.getElementById("root")!).render(
  <App />
);
```

这个文件就做了一件事：在 HTML 里找到那个叫 `root` 的空容器，然后把 `App` 这个组件塞进去。页面就出来了。

这里出现了第一个关键概念——**`import`**。看文件顶部的这行：

```tsx
import { App } from "./App";
```

意思是"从旁边的 `App.tsx` 文件里，把 `App` 这个东西拿过来用"。你可以理解为文档里的"参见附件 A"——代码用 import 来引用其他文件的功能。

#### 穿插讲解：import 的两种写法

这里顺便讲一下代码里 `import` 的两种写法，以后你会反复看到：

**第一种：`./` 或 `../` 开头——自己项目里的文件**

```tsx
import { App } from "./App";           // 当前目录下的 App 文件
import { Message } from "../api";       // 上一级目录的 api 文件
```

`.` 是"我在的这个文件夹"，`..` 是"往上走一层"。就像你跟同事说"这个文件夹里的那个文档"、"上一层目录的那个表格"——是相对你当前位置来说的。看到这种写法，你可以直接在项目里找到对应的文件，点过去看源码。

**第二种：直接写名字——第三方库**

```tsx
import { useState } from "react";
```

没有 `./`，直接写名字。这是从**第三方库**里引入的，不是你项目里的文件。

那它在哪？还记得上节课看文件树的时候，有一个叫 `node_modules` 的文件夹吗？所有第三方库都装在那里面。你执行 `npm install` 的时候，它就会根据 `package.json` 里的清单，把需要的库下载到 `node_modules` 里。

用 Figma 类比的话——你在 Figma 里启用一个团队组件库，然后就能从 Assets 面板里拖组件来用，对吧？你不需要自己画那些组件，别人已经做好了。`npm install` 就相当于"启用组件库"，`node_modules` 就是那个 Assets 面板，里面全是别人做好的东西。你 `import` 一下就能用，不需要知道它内部怎么实现的。

总结一下：**`./` 开头 = 自己的文件，可以点过去看；直接写名字 = 别人的库，不用管。**

好，回到主线。现在我们知道了：**所有的内容都从 `App` 开始**。下一步，去看 `App.tsx`。

---

### 第二步：读根组件 App.tsx（0:20-0:28）

（打开 `client/src/App.tsx`）

这个文件是整个页面的"管家"——数据存在这里，用户操作也在这里处理。

从上往下看。

#### 状态声明

先看最前面这两行：

```tsx
const [messages, setMessages] = useState<Message[]>([]);
const [loading, setLoading] = useState(false);
```

这两行是这个组件的**状态（state）**。

什么是状态？你可以把它想成一块**白板**。页面上要显示什么内容、现在处于什么情况，都写在这块白板上。

- `messages`：消息列表，一开始是空的 `[]`——白板上还没写东西
- `loading`：正在等回复吗？一开始是 `false`——没有在等

这两个状态有什么用？**状态一变，页面自动刷新**。你不需要手动去改页面上的文字或者增删元素，只要改白板上的数据，React 会自动帮你重新画页面。这个机制下节课会详细讲，今天先记住这个结论。

但为什么不能用普通变量呢？比如直接写 `let messages = []`，往里面 push 不也行吗？

我们拿项目里发消息的代码来对比一下：

```tsx
// ❌ 假如用普通变量
let messages = [];

const handleSend = async (text: string) => {
  messages.push({ role: "user", content: text, ... });
  // messages 确实变了——但页面上什么都没发生
  // 你打了字，点了发送，聊天窗口还是空的
};
```

```tsx
// ✅ 项目里实际的写法
const [messages, setMessages] = useState<Message[]>([]);

const handleSend = async (text: string) => {
  setMessages((prev) => [...prev, userMsg]);
  // 页面立刻多了一条消息气泡
};
```

区别就一件事：`useState` 的 set 函数是一个**变更通知机制**。你调 `setMessages()`，相当于告诉 React："数据变了，请重新画页面。"普通变量没有这个通知能力——数据改了，React 根本不知道，页面就纹丝不动。

再看 `loading` 更直观——`setLoading(true)` 的时候发送按钮变灰、出现加载动画；`setLoading(false)` 按钮恢复。如果用 `let loading = true`，按钮永远不会变。

所以 `useState` 的本质就是：**你跟 React 之间的通信通道。通过 set 函数通知 React 数据变了，React 才会更新页面。**

另外注意写法：`useState` 返回的是一对东西——**当前值**和**修改函数**。`messages` 是当前值，`setMessages` 是用来改它的函数。想改白板上的内容，必须用 `set` 开头的那个函数，不能直接改。

#### useEffect

接下来看这一段：

```tsx
useEffect(() => {
  fetchWelcome().then((welcomeText) => {
    setMessages([{ role: "assistant", content: welcomeText, ... }]);
  });
}, []);
```

这段代码的意思是：**页面第一次打开的时候，去后端拿欢迎消息，拿到之后放进消息列表里**。

`useEffect` 你可以理解为"页面加载完之后，自动执行的一段代码"。就像你打开一个 App，它会自动帮你加载首页内容——不需要你点任何按钮，打开就开始干活了。

里面的 `fetchWelcome()` 是什么？上节课我们在 Network 面板里看到过一个 `/api/welcome` 的请求，对吧？就是这行代码发出去的。我们可以去看看它具体怎么写的。

（打开 `client/src/api.ts`，指向 `fetchWelcome` 函数）

```tsx
export async function fetchWelcome(): Promise<string> {
  const response = await fetch("/api/welcome");
  const data = await response.json();
  return data.message;
}
```

三行核心代码：用 `fetch` 发一个请求到 `/api/welcome`，等服务器返回数据，然后把里面的 `message` 字段取出来。

这里的 `await` 是什么意思？"等一下"。发请求需要时间，`await` 就是告诉程序"别急着往下走，等这个请求回来了再继续"。

然后回到 App.tsx——`fetchWelcome()` 拿到了欢迎文字，`.then()` 里面用 `setMessages` 把它写到白板上，页面就自动更新了，你就看到了那条欢迎消息。

你看，我们刚才做的事情就是"顺着数据流走"：**useEffect 触发 → fetchWelcome 发请求 → 后端返回数据 → setMessages 更新白板 → 页面显示欢迎消息**。一条线串起来了。

#### 用 Console 验证

刚才我们是"看代码猜流程"。现在来验证一下——还记得上节课学的 Console 面板吗？

其实这个项目的代码里已经埋好了 `console.log`。打开 `api.ts` 你看：

```tsx
console.log("[前端] 正在获取欢迎消息...");
// ...
console.log("[前端] 收到欢迎消息:", data.message);
```

这些 `console.log` 就是代码在"自言自语"——它执行到这一行的时候，会在 Console 面板里打一句话。

现在大家试一下：打开 Demo 项目的页面，按 `Cmd+Option+I` 打开 DevTools，切到 Console 面板，然后**刷新页面**。

（等学员操作）

看到了吗？Console 里应该出现了两行：

```
[前端] 正在获取欢迎消息...
[前端] 收到欢迎消息: 你好！我是 Demo 助手，有什么可以帮你的？
```

先打了"正在获取"，然后打了"收到了"——跟我们刚才读代码时分析的顺序一模一样。**Console 面板就是帮你验证"代码是不是按照你理解的顺序在跑"的工具。**

再试一下：在聊天框里发一条消息，看看 Console 面板又多了什么。

（等学员操作）

```
[前端] 发送消息: 你好
[前端] 收到回复: 你好呀！很高兴见到你...
```

以后你自己读代码时，如果看不懂某个地方的数据是什么，就加一行 `console.log("变量名:", 变量)` 进去，刷新页面看 Console 面板。这是最简单、最直接的调试方式。

#### handleSend

欢迎消息搞定了。接下来看用户发消息的时候发生了什么——`handleSend` 函数。

```tsx
const handleSend = async (text: string) => {
  // 1. 先把用户消息加到列表里
  const userMsg: Message = { role: "user", content: text, ... };
  setMessages((prev) => [...prev, userMsg]);
  setLoading(true);

  // 2. 发请求给后端，等回复
  const { reply, timestamp } = await sendMessage(text);

  // 3. 把回复加到列表里
  const assistantMsg: Message = { role: "assistant", content: reply, ... };
  setMessages((prev) => [...prev, assistantMsg]);
  setLoading(false);
};
```

这个函数做了三件事，注释里已经写得很清楚了：

**第一步**，你点了发送，它立刻把你输入的文字加到消息列表里。`setMessages` 一调用，白板更新了，页面上马上就多了一条你的消息气泡。同时把 `loading` 设成 `true`——"正在等回复"。

**第二步**，调 `sendMessage(text)` 给后端发请求。这个函数也在 `api.ts` 里，跟刚才的 `fetchWelcome` 类似，只不过是一个 POST 请求，会把你输入的文字发给服务器。`await` 在这里等着——等服务器回复。

**第三步**，收到回复了，把回复也加到消息列表里。`setMessages` 再调一次，白板又更新了，页面上多了一条助手的气泡。`loading` 设回 `false`——"等完了"。

整个过程就是在反复做同一件事——**改 `messages` 这个状态**。状态变了，页面就自动更新了。你不需要手动去操作页面上的元素。

顺便说一下这里的注释——就是 `//` 后面那些灰色的文字。注释不会被执行，是写给人看的说明。你们用 Figma 的时候会在设计稿上加批注对吧？比如在一个按钮旁边留一条评论说"这个按钮点击后跳转到设置页"——这条评论不影响设计稿本身，但看到的人立刻就知道这个按钮要干嘛。代码里的注释就是同一个东西。你读代码的时候**先看注释**，很多时候注释已经把这段代码在干嘛写清楚了，比逐行读代码快得多。

#### render 部分（JSX）

最后看 App.tsx 的 `return` 部分：

```tsx
return (
  <div className="app">
    <header className="app-header">
      <h1>Demo 聊天助手</h1>
    </header>
    <ChatWindow messages={messages} loading={loading} />
    <ChatInput onSend={handleSend} disabled={loading} />
  </div>
);
```

这部分描述的是页面长什么样。看起来是不是很像 HTML？这个写法叫 JSX——React 用它来描述页面结构。你可以把它当成 HTML 来读，区别不大。

注意里面有两个自定义组件——`ChatWindow` 和 `ChatInput`。什么叫组件？**组件就是一个可复用的页面零件。**按钮是一个零件，输入框是一个零件，整个聊天窗口也是一个零件。你把零件拼起来，就是一个完整的页面。

重点看零件之间是怎么配合的：

- `ChatWindow` 接收了 `messages` 和 `loading`——App 把白板上的数据**分享给了** ChatWindow，ChatWindow 拿到数据之后负责画出所有的消息气泡
- `ChatInput` 接收了 `onSend={handleSend}`——意思是"用户点发送的时候，调用 App 的 handleSend 函数"。ChatInput 自己不处理发消息的逻辑，它只是**告诉 App"用户点了"**，具体怎么处理是 App 的事

这就是组件之间的分工：**App 是管家，管数据和逻辑；ChatWindow 和 ChatInput 是员工，一个负责展示，一个负责收集用户输入。** 管家把数据发给员工，员工把用户的操作汇报给管家。

（板书画出组件树）

```
App（管家：管数据、管请求）
├── ChatWindow（展示：接收 messages，画出所有气泡）
│   └── MessageBubble（展示：画一条消息）
└── ChatInput（交互：用户输入，触发 onSend）
```

#### 动手加一个组件

光看不过瘾，我们来动手加一个自己的组件。

需求很简单：在聊天窗口上方显示"共 X 条消息"。就这么一行字。

第一步，创建组件文件。在 `client/src/components/` 文件夹下新建一个文件，叫 `MessageCount.tsx`：

```tsx
interface MessageCountProps {
  count: number;
}

export function MessageCount({ count }: MessageCountProps) {
  return <div className="message-count">共 {count} 条消息</div>;
}
```

就这么几行。拆开看：
- 它接收一个 `count`（数字）——这就是别人传给它的数据
- 它返回一段 JSX，把 `count` 显示出来
- 大括号 `{count}` 是 JSX 里插入变量的写法——"这个位置放 count 的值"

第二步，在 App 里用它。打开 `App.tsx`，先在文件顶部加一行 import：

```tsx
import { MessageCount } from "./components/MessageCount";
```

然后在 `return` 里面，`ChatWindow` 上面加一行：

```tsx
<MessageCount count={messages.length} />
```

`messages.length` 就是消息列表里有几条消息。我们把这个数字传给了 MessageCount 组件。

第三步，保存，看页面。

（等学员操作）

看到了吗？上面多了一行"共 1 条消息"——因为有一条欢迎消息。现在发一条消息试试。

（发一条消息）

变成"共 3 条消息"了——你发了一条，助手回了一条，加上欢迎消息一共三条。你没有写任何"更新数字"的代码，**只是把 `messages.length` 传给了组件，React 自动帮你更新了**。

现在回头看组件树，你自己加的零件已经拼上去了：

```
App（管家）
├── MessageCount ← 你刚加的！
├── ChatWindow
│   └── MessageBubble
└── ChatInput
```

---

### 第三步：追一条完整的数据流（0:28-0:35）

刚才我们一个文件一个文件地看，现在把它们串起来。我们来追踪一个完整的流程——你发一条"你好"，到页面显示回复，中间经过了哪些文件、哪些函数。

（边说边在 VS Code 中跳转到对应文件）

**第一站：ChatInput.tsx**

你在输入框打了"你好"，点发送。ChatInput 组件里的 `handleSubmit` 函数被触发，它调用了 `onSend(trimmed)`——还记得吗？`onSend` 是 App 传给它的，实际上就是 App 的 `handleSend` 函数。所以这一步是**员工向管家汇报："用户发了一条消息"**。

**第二站：App.tsx**

App 的 `handleSend` 开始干活。先用 `setMessages` 把你的消息加到列表里——页面上立刻多了一条气泡。然后调 `sendMessage(text)` 发请求。

**第三站：api.ts**

`sendMessage` 用 `fetch` 发了一个 POST 请求到 `/api/chat`，把你输入的"你好"装在请求体里发给后端。`await` 等着——等后端回复。

**第四站：后端（server/index.ts → replies.ts）**

请求到了后端。后端怎么处理的我们第 4 课会详细讲，今天你只需要知道：它收到了"你好"，匹配了一条回复，然后把回复作为 JSON 返回给前端。你可以打开 `replies.ts` 看看那个关键词列表——这就是它"选回复"的逻辑。

**第五站：回到 api.ts → App.tsx**

前端收到了后端的 JSON 响应，`sendMessage` 把 `reply` 和 `timestamp` 返回给 App。App 的 `handleSend` 用 `setMessages` 把这条回复也加到消息列表里——页面上又多了一条气泡。

整条线串起来了：

```
ChatInput → App → api.ts → 后端 → api.ts → App → ChatWindow
```

**以后遇到 bug，你就沿着这条线找。** 页面上没出现气泡？检查 App 的 `setMessages` 有没有被调用。请求发了但没回复？打开 Network 面板看请求状态。回复内容不对？去 `replies.ts` 看匹配规则。每次只需要在这条线上定位到出问题的那一站就行了。

---

## 0:35-0:40 — JS 和 React 的关系 + 速查卡

### JS 和 React 的关系

在发速查卡之前，先聊一个你们可能已经困惑的问题：我一会儿说 JavaScript，一会儿说 React，它俩到底什么关系？

**JavaScript 是语言，React 是工具。**

打个比方：JavaScript 就像"中文"，React 就像"飞书文档"。你用中文写东西，这是语言层面的能力——语法、词汇、表达方式。飞书文档是一个工具，它帮你把中文内容组织成有结构的文档——标题、正文、表格、评论。你得会中文才能用飞书文档，但会中文不代表你一定要用飞书文档，你也可以用 Word、用 Notion。

代码也一样。`const`、`function`、`if`、`await` 这些是 JavaScript 语言自带的——换任何框架都长这样。而 `useState`、`useEffect`、`<组件名 />` 这些是 React 这个工具提供的——只有用 React 写项目时才会出现。

所以速查卡我分了两块：上面是 JS 通用的，下面是 React 特有的。以后你看到不认识的写法，先判断它是语言层面的还是框架层面的，搜的时候更容易找到答案。

### 速查卡

（投屏展示，同时发群里）

```
JS / React 读代码速查卡
═══════════════════════════

import ... from "..."    → 从别的文件引入功能，像"参见附件"
export function Xxx()    → 把这个函数公开，让别的文件能 import
const x = 值             → 声明一个变量（一个有名字的盒子）
函数名(参数)              → 调用函数（让它执行）
async / await            → 等待一个需要时间的操作（比如网络请求）
.then(callback)          → 另一种等待方式，"等结果出来后执行 callback"
// 注释内容              → 给人看的说明，代码不会执行

// React 特有
<组件名 属性={值} />      → 使用一个组件，给它传数据（叫 props）
useState(初始值)          → 声明一个状态，返回 [当前值, 修改函数]
useEffect(() => {}, [])  → 页面加载后执行一次的代码
{条件 && <元素>}          → 条件为真时才显示这个元素
{数组.map(item => ...)}  → 把数组里的每一项变成一个页面元素
console.log(值)          → 在 Console 面板里打印内容，用来调试
```

**不需要背。** 这张卡的用法是——你在读代码时碰到一个看不懂的写法，来查一下，知道它大概干嘛的就行。用多了自然就记住了。

---

## 0:40-0:50 — 动手环节

现在换你们来。我们从具体的问题出发——带着问题读代码，比漫无目的地看有效得多。

（发到群里）

```
动手任务：从问题出发，读代码找答案

打开 Demo 项目，用 VS Code 看代码来回答以下问题。
不许跑代码，纯看代码回答！

任务 1（热身）：
  欢迎消息"你好！我是 Demo 助手，有什么可以帮你的？"
  写在哪个文件的第几行？

任务 2（追数据流）：
  你在聊天框里输入"天气"，点发送。
  请你从 ChatInput.tsx 出发，一步一步追踪这条消息经过了哪些文件、哪些函数，
  最终回复是怎么生成的。
  回答格式：
  - 第一步：ChatInput.tsx 的 ______ 函数被调用，它做了 ______
  - 第二步：跳到 ______ 文件的 ______ 函数，它做了 ______
  - ...一直追到最终生成回复的地方
  最后写出：页面上会显示什么回复内容？

任务 3（理解组件）：
  MessageBubble 组件怎么判断一条消息是"用户发的"还是"助手回的"？
  它们在页面上有什么区别？（提示：看 className）

任务 4（加分）：
  如果我想加一个功能——用户发送"历史"这个关键词时，
  返回"你一共发了 X 条消息"。应该改哪个文件的哪个地方？
  不需要真的改，描述你的思路就行。
```

给你们一个小技巧：VS Code 里按 `Cmd+Shift+F`，可以在所有文件里搜索关键词。比如任务 1，直接搜"Demo 助手"就能找到那行代码在哪。这是读代码时最实用的功能，以后会经常用到。

（让学员操作，巡视帮助）

---

## 0:50-1:00 — 答疑 + 作业 + 预告

今天的内容就到这里。总结一下，今天就学了一个方法：**找入口，顺着数据流走**。

再重复一下步骤：
1. 找到入口文件——打开 `index.html`，看 `<script>` 指向谁
2. 看入口引用了谁——顺着 `import` 一路点过去
3. 带着具体的问题，沿着数据流追踪：用户操作 → 函数 → 请求 → 响应 → 状态更新 → 页面刷新

你不需要每行代码都看懂。**读代码是为了回答一个具体的问题**——"这个按钮点了之后调了哪个接口？""这段文字是从哪里来的？"有了问题，你才知道该追哪条线。

有什么问题吗？

（回答问题，处理方式同第一课）

好，布置作业。

（发到群里）

```
第 2 课作业：读代码回答问题

打开你自己的 vibe coding 项目（或 Demo 项目），回答以下问题：

1. 找到你项目的入口文件是哪个，截图或写出文件路径
2. 从入口文件出发，画出你项目的组件树
   （格式不限：文本缩进、手绘拍照、任何方式都行）
3. 挑一个你项目里的用户交互（比如点按钮、提交表单），
   像课上一样追踪它的数据流，写出每一步经过了哪个文件、哪个函数

提交方式：放到 homework/你的文件夹/ 下，文件名建议 lesson-2-read-code.md
```

预告下节课：

下节课我们讲 **React 的心智模型**——组件、状态、渲染。今天我们已经看到了 `useState`、props、组件树这些东西，下节课把它们讲透：为什么状态一变页面就更新？props 到底是怎么传的？搞懂这些，你就能看懂 AI 写的绝大部分 React 代码了。
