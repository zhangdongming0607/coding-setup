// 第 4 课 Live Coding 起点
// 从后端 API 获取 Issue，状态变更同步到服务端

import { getIssues, updateIssueStatus, type Issue } from './api/issues';
import { IssueCard } from './components/issue-card';
import { useEffect, useState } from 'react';

export default function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getIssues()
      .then((data) => {
        if (!cancelled) setIssues(data);
      })
      .catch(() => {
        if (!cancelled) setIssues([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleChangeStatus(id: number, status: string) {
    try {
      const updated = await updateIssueStatus(id, status);
      setIssues((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch {
      console.error('更新状态失败');
    }
  }

  return (
    <div className="app">
      <h1>Issue 看板</h1>
      <p>从这里开始写第一个组件 👇</p>
      {loading ? (
        <p>加载中…</p>
      ) : (
        issues.map((issue) => (
          <IssueCard
            key={issue.id}
            assignee={issue.assignee}
            label={issue.label}
            title={issue.title}
            status={issue.status}
            onChangeStatus={(status) => {
              void handleChangeStatus(issue.id, status);
            }}
          />
        ))
      )}
    </div>
  );
}
