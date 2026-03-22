// issue 卡片组件

import { useState } from "react";

interface IssueCardProps {
  title: string;      // 标题，必须是文字
  label: string;      // 标签（Bug / 需求 / 设计）
  assignee: string;   // 负责人
  status: string;         // QA
  onChangeStatus: (status: string) => void;
}

export const IssueCard = ({label, title, assignee, status, onChangeStatus}: IssueCardProps) => {
    return (
        <div className="issue-card">
            <span className="label">{label}</span>
            <h3>{title}</h3>
            <p>负责人: {assignee}</p>
            <p>状态: {status}</p>
            <div>
                <button onClick={() => {
                onChangeStatus('待处理')
                console.log(status);
            }}>待处理</button>
            <button onClick={() => {
                onChangeStatus('进行中')
                console.log(status);
            }}>进行中</button>
            <button onClick={() => {
                onChangeStatus('已完成')
                console.log(status);
            }}>已完成</button>
            </div>
        </div>
    )
}