// Vercel Serverless Function 版本（带数据库）
// 部署到 Vercel 时，这个文件自动变成 /api/issues 接口
// 用 Vercel KV（Redis）存数据，改了状态刷新不会丢

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

// ============================================================
// 默认数据（第一次访问时写入数据库）
// ============================================================

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

// 从数据库读 issues，如果没有就用默认数据初始化
async function getIssues(): Promise<Issue[]> {
  const issues = await kv.get<Issue[]>("issues");
  if (!issues) {
    await kv.set("issues", defaultIssues);
    return defaultIssues;
  }
  return issues;
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
    const parts = req.url?.split("/") ?? [];
    const id = Number(parts[parts.length - 1]);
    const { status } = req.body;

    const issues = await getIssues();
    const issue = issues.find((item) => item.id === id);
    if (!issue) {
      return res.status(404).json({ error: "Issue 不存在" });
    }

    issue.status = status;
    await kv.set("issues", issues);
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
    await kv.set("issues", issues);
    return res.json(newIssue);
  }

  res.status(405).json({ error: "Method not allowed" });
}
