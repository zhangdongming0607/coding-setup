// 第 3 课 Live Coding 起点
// 课上从这里开始，一步步加功能

import { IssueCard } from './components/issue-card';
import { useState } from 'react';

export default function App() {
  const [issues, setIssues] = useState([
    {label: 'Bug', title: '首页加载速度太慢', assignee: '小明', status: '进行中', priority: 'P0'},
    {label: 'Bug', title: '登录功能异常', assignee: '小明', status: '待处理', priority: 'P1'},
    {label: 'Bug', title: '注册功能异常', assignee: '小明', status: '进行中', priority: 'P1'},
    {label: 'Bug', title: '忘记密码功能异常', assignee: '小明', status: '待处理', priority: 'P2'},
    {label: 'Bug', title: '用户中心功能异常', assignee: '小明', status: '进行中', priority: 'P2'},
  ])

  // const handleEffect = () => {
  //   alert('欢迎来到 issue 看板')
  // }

  // useEffect(handleEffect, [])

  return (
    <div className="app">
      <h1>Issue 看板</h1>
      <p>从这里开始写第一个组件 👇</p>
      {issues.map((issue, index) => {
        return <IssueCard key={issue.title} assignee={issue.assignee} label={issue.label} title={issue.title} status={issue.status} priority={issue.priority} onChangeStatus={(status) => {
          setIssues(() => {
            const newIssues = [...issues];
            newIssues[index] = {label: issue.label, title: issue.title, assignee: issue.assignee, status: status, priority: issue.priority};
            return newIssues;
          })
        }} />
      })}
    </div>
  );
}
