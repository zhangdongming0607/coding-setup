// 本地开发版后端
// 用 Express 跑在 localhost:3001，前端通过 Vite 代理访问
// 用 Upstash Redis 存数据，本地和线上共用同一份数据

import "dotenv/config";
import { config } from "dotenv";
config({ path: "../.env.local" });
import express from "express";
import { Redis } from "@upstash/redis";

const app = express();
// app.use(express.json());

// ============================================================
// Redis 连接
// ============================================================

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 默认数据（第一次访问时写入 Redis）
const defaultIssues = [
  { id: 1, label: "Bug", title: "首页加载速度太慢", assignee: "小明", status: "进行中" },
  { id: 2, label: "Bug", title: "登录功能异常", assignee: "小明", status: "待处理" },
  { id: 3, label: "Bug", title: "注册功能异常", assignee: "小明", status: "进行中" },
  { id: 4, label: "Bug", title: "忘记密码功能异常", assignee: "小明", status: "待处理" },
  { id: 5, label: "Bug", title: "用户中心功能异常", assignee: "小明", status: "进行中" },
];

type Issue = {
  id: number;
  label: string;
  title: string;
  assignee: string;
  status: string;
};

async function getIssues(): Promise<Issue[]> {
  const issues = await redis.get<Issue[]>("issues");
  if (!issues) {
    await redis.set("issues", defaultIssues);
    return defaultIssues;
  }
  return issues;
}

async function saveIssues(issues: Issue[]) {
  await redis.set("issues", issues);
}

// ============================================================
// API
// ============================================================

// GET /api/issues —— 获取所有 Issue
app.get("/api/issues", async (req, res) => {
  const issues = await getIssues();
  res.json(issues);
});

// PUT /api/issues/:id —— 修改一个 Issue 的状态
app.put("/api/issues/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  const issues = await getIssues();
  const issue = issues.find((item) => item.id === id);
  if (!issue) {
    res.status(404).json({ error: "Issue 不存在" });
    return;
  }

  issue.status = status;
  await saveIssues(issues);
  res.json(issue);
});

// POST /api/issues —— 新增一个 Issue
app.post("/api/issues", async (req, res) => {
  const { label, title, assignee } = req.body;
  const issues = await getIssues();

  const newIssue = {
    id: issues.length + 1,
    label,
    title,
    assignee,
    status: "待处理",
  };

  issues.push(newIssue);
  await saveIssues(issues);
  res.json(newIssue);
});

// ============================================================
// 启动服务器
// ============================================================

app.listen(3001, () => {
  console.log("后端跑在 http://localhost:3001");
});
