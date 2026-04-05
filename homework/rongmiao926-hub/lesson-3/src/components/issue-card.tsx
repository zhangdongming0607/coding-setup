// issue 卡片组件

interface IssueCardProps {
  title: string;      // 标题，必须是文字
  label: string;      // 标签（Bug / 需求 / 设计）
  assignee: string;   // 负责人
  priority: string;   // 优先级（P0 / P1 / P2）
  status: string;         // QA
  onChangeStatus: (status: string) => void;
}

export const IssueCard = ({label, title, assignee, priority, status, onChangeStatus}: IssueCardProps) => {
    return (
        <div className="issue-card">
            <div className="card-header">
                <span className="label">{label}</span>
                <span className={`priority priority-${priority.toLowerCase()}`}>{priority}</span>
                <span className="status">{status}</span>
            </div>
            <h3>{title}</h3>
            <p>负责人: {assignee}</p>
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
