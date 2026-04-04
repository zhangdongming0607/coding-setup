export type Issue = {
  id: number;
  label: string;
  title: string;
  assignee: string;
  status: string;
};

export async function getIssues(): Promise<Issue[]> {
  const res = await fetch('/api/issues');
  if (!res.ok) throw new Error('加载失败');
  return res.json() as Promise<Issue[]>;
}

export async function updateIssueStatus(id: number, status: string): Promise<Issue> {
  const res = await fetch(`/api/issues/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('更新状态失败');
  return res.json() as Promise<Issue>;
}
