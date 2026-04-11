// Vercel Serverless Function 版本（带 Redis 数据库）
// 部署到 Vercel 时，这个文件自动变成 /api/issues 接口
// 用 Upstash Redis 存数据，改了状态刷新不会丢

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";

// ============================================================
// Redis 连接
// ============================================================

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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
// 请求处理
// ============================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET /api/issues —— 获取所有 Issue
  if (req.method === "GET") {
    const issues = await getIssues();
    return res.json(issues);
  }

  // PUT /api/issues/:id —— 修改状态
  if (req.method === "PUT") {
    const id = Number(req.query.id);
    const { status } = req.body;

    const issues = await getIssues();
    const issue = issues.find((item) => item.id === id);
    if (!issue) {
      return res.status(404).json({ error: "Issue 不存在" });
    }

    issue.status = status;
    await saveIssues(issues);
    return res.json(issue);
  }

  // POST /api/issues —— 新增 Issue
  if (req.method === "POST") {
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
    return res.json(newIssue);
  }

  res.status(405).json({ error: "Method not allowed" });
}
