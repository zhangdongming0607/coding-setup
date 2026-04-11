// Vercel Serverless Function 版本
// 部署到 Vercel 时，这个文件自动变成 /api/issues 接口
// 功能跟 server/index.ts（Express 版本）完全一样

import type { VercelRequest, VercelResponse } from "@vercel/node";

// ============================================================
// 数据（跟 server/index.ts 一样）
// ============================================================

const issues = [
  { id: 1, label: "Bug", title: "首页加载速度太慢", assignee: "小明", status: "进行中" },
  { id: 2, label: "Bug", title: "登录功能异常", assignee: "小明", status: "待处理" },
  { id: 3, label: "Bug", title: "注册功能异常", assignee: "小明", status: "进行中" },
  { id: 4, label: "Bug", title: "忘记密码功能异常", assignee: "小明", status: "待处理" },
  { id: 5, label: "Bug", title: "用户中心功能异常", assignee: "小明", status: "进行中" },
];

// ============================================================
// 请求处理
// ============================================================

export default function handler(req: VercelRequest, res: VercelResponse) {
  // GET /api/issues —— 获取所有 Issue
  if (req.method === "GET") {
    return res.json(issues);
  }

  // PUT /api/issues/:id —— 修改状态
  if (req.method === "PUT") {
    // 从 URL 里取出 id（比如 /api/issues/3 → 取出 "3"）
    const parts = req.url?.split("/") ?? [];
    const id = Number(parts[parts.length - 1]);
    const { status } = req.body;

    const issue = issues.find((item) => item.id === id);
    if (!issue) {
      return res.status(404).json({ error: "Issue 不存在" });
    }

    issue.status = status;
    return res.json(issue);
  }

  // POST /api/issues —— 新增 Issue
  if (req.method === "POST") {
    const { label, title, assignee } = req.body;
    const newIssue = {
      id: issues.length + 1,
      label,
      title,
      assignee,
      status: "待处理",
    };
    issues.push(newIssue);
    return res.json(newIssue);
  }

  // 其他方法不支持
  res.status(405).json({ error: "Method not allowed" });
}
