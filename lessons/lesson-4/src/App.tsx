// 第 4 课 Live Coding 起点
// 课上会把硬编码数据改成从后端 API 获取

import { IssueCard } from './components/issue-card';
import { useEffect, useState } from 'react';
import { getIssues, updateIssueStatus, type Issue } from './api'

export default function App() {
  const [issues, setIssues] = useState<Issue[]>([])

  useEffect(() => {
    getIssues().then(data => {
      setIssues(data)
    })
  }, [])

  return (
    <div className="app">
      <h1>Issue 看板</h1>
      <p>从这里开始写第一个组件 👇</p>
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          assignee={issue.assignee}
          label={issue.label}
          title={issue.title}
          status={issue.status}
          onChangeStatus={(status) => {
            updateIssueStatus(issue.id, status).then((updated) => {
              setIssues((prev) =>
                prev.map((i) => (i.id === issue.id ? updated : i))
              );
            });
          }}
        />
      ))}
    </div>
  );
}
