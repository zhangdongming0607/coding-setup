export type Issue = {
  id: number;
  label: string;
  title: string;
  assignee: string;
  status: string;
};

export function getIssues(): Promise<Issue[]> {
  return fetch("/api/issues", { method: "GET" })
    .then((res) => res.json())
    .then((data: Issue[]) => data);
}

export function updateIssueStatus(id: number, status: string): Promise<Issue> {
  return fetch(`/api/issues/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then((res) => {
    if (!res.ok) {
      alert('更新状态失败');
      throw new Error(
        `Failed to update issue status: ${res.status} ${res.statusText}`,
      );
    }
    return res.json() as Promise<Issue>;
  });
}