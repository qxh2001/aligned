import type { Response } from "express";

const clients = new Map<number, Set<Response>>();

export function addClient(projectId: number, res: Response) {
  if (!clients.has(projectId)) {
    clients.set(projectId, new Set());
  }
  clients.get(projectId)!.add(res);

  res.on("close", () => {
    clients.get(projectId)?.delete(res);
    if (clients.get(projectId)?.size === 0) {
      clients.delete(projectId);
    }
  });
}

export function broadcast(projectId: number, event: string, data?: unknown) {
  const projectClients = clients.get(projectId);
  if (!projectClients) return;

  const message = `event: ${event}\ndata: ${JSON.stringify(data || {})}\n\n`;
  for (const client of projectClients) {
    client.write(message);
  }
}
