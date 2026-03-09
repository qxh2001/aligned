import { apiRequest } from "./queryClient";

export async function getProjects() {
  try {
    const res = await fetch("/api/projects", { credentials: "include" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getProject(id: number) {
  try {
    const res = await fetch(`/api/projects/${id}`, { credentials: "include" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createProject(data: { name: string; description?: string }) {
  const res = await apiRequest("POST", "/api/projects", data);
  return res.json();
}

export async function addActionItem(projectId: number, text: string) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/action-items`, { text });
  return res.json();
}

export async function removeActionItem(projectId: number, itemId: number) {
  await apiRequest("DELETE", `/api/projects/${projectId}/action-items/${itemId}`);
}

export async function addDocument(projectId: number, doc: { label: string; url: string; tool: string }) {
  const res = await apiRequest("POST", `/api/projects/${projectId}/documents`, doc);
  return res.json();
}

export async function removeDocument(projectId: number, docId: number) {
  await apiRequest("DELETE", `/api/projects/${projectId}/documents/${docId}`);
}

export async function updateChannels(projectId: number, channels: { appKey: string; label: string; iconUrl?: string; link?: string }[]) {
  const res = await apiRequest("PUT", `/api/projects/${projectId}/channels`, { channels });
  return res.json();
}

export async function updateChannelLink(projectId: number, appKey: string, link: string) {
  await apiRequest("PUT", `/api/projects/${projectId}/channels/${appKey}/link`, { link });
}

export async function updateMemberTags(projectId: number, userId: number, tags: string[]) {
  await apiRequest("POST", `/api/projects/${projectId}/members/${userId}/tags`, { tags });
}

export async function removeMember(projectId: number, userId: number) {
  await apiRequest("DELETE", `/api/projects/${projectId}/members/${userId}`);
}

export async function joinProject(token: string) {
  const res = await apiRequest("POST", `/api/invite/${token}`);
  return res.json();
}

export async function getInviteInfo(token: string) {
  const res = await fetch(`/api/invite/${token}`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}
