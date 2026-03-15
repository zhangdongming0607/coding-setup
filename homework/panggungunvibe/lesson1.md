# 第1课作业

## 任务1：看看页面发了哪些请求

我打开了 demo 项目，并在浏览器 DevTools 的 Network 面板里刷新页面进行了观察。

### 1. 页面一共发了多少个网络请求
我观察到页面刷新后，一共发出了 **20 个** 网络请求。

### 2. 请求数截图
![请求数截图](./lesson1-homework/network-count.png)

### 3. 我找到的一个 API 请求
我找到了一条 **Fetch/XHR** 类型的请求，名称是 **chat**。

### 4. Response 返回了什么
这个请求返回的是一段 JSON 数据，里面包含了：
- `reply`：AI 返回的回复内容
- `timestamp`：返回时间

我在截图里看到，这次返回的 `reply` 内容大致是：“你好呀！很高兴见到你，有什么想聊的吗？”

### 5. API 请求截图
![API请求截图](./lesson1-homework/response-request.png)