// 本地开发版后端
// 用 Express 跑在 localhost:3001，前端通过 Vite 代理访问
// 部署时不用这个文件——Vercel 用 api/issues.ts 代替

import express from "express";

const app = express();
// app.use(express.json());

// ============================================================
// 数据（从第 3 课的 App.tsx 搬过来，多了 id 字段）
// ============================================================

const issues = [
  { id: 1, label: "Bug", title: "首页加载速度太慢", assignee: "小明", status: "进行中" },
  { id: 2, label: "Bug", title: "登录功能异常", assignee: "小明", status: "待处理" },
  { id: 3, label: "Bug", title: "注册功能异常", assignee: "小明", status: "进行中" },
  { id: 4, label: "Bug", title: "忘记密码功能异常", assignee: "小明", status: "待处理" },
  { id: 5, label: "Bug", title: "用户中心功能异常", assignee: "小明", status: "进行中" },
];

// ============================================================
// API
// ============================================================

// GET /api/issues —— 获取所有 Issue
app.get("/api/issues", (req, res) => {
  res.json(issues);
});

// PUT /api/issues/:id —— 修改一个 Issue 的状态
app.put("/api/issues/:id", (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  const issue = issues.find((item) => item.id === id);
  if (!issue) {
    res.status(404).json({ error: "Issue 不存在" });
    return;
  }

  issue.status = status;
  res.json(issue);
});

// POST /api/issues —— 新增一个 Issue
app.post("/api/issues", (req, res) => {
  const { label, title, assignee } = req.body;

  const newIssue = {
    id: issues.length + 1,
    label,
    title,
    assignee,
    status: "待处理",
  };

  issues.push(newIssue);
  res.json(newIssue);
});

// ============================================================
// 启动服务器
// ============================================================

app.listen(3001, () => {
  console.log("后端跑在 http://localhost:3001");
});
