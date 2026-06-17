import type {
  User, Project, Diagram, DiagramVersion, Comment, CommentReply,
  DiagramTemplate, Operation, DiagramType, MemberRole
} from '@shared/types.js';

const API_BASE = '/api';
const TOKEN_KEY = 'flowsync_token';
const USER_KEY = 'flowsync_user';

const headers = (extra: Record<string, string> = {}) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY) ?? ''}`,
  ...extra,
});

const handle = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || String(res.status));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
};

const get = <T>(path: string) => fetch(`${API_BASE}${path}`, { headers: headers() }).then(handle<T>);
const post = <T>(path: string, body?: any) => fetch(`${API_BASE}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body ?? {}) }).then(handle<T>);
const put = <T>(path: string, body?: any) => fetch(`${API_BASE}${path}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body ?? {}) }).then(handle<T>);
const patch = <T>(path: string, body?: any) => fetch(`${API_BASE}${path}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body ?? {}) }).then(handle<T>);
const del = <T>(path: string) => fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: headers() }).then(handle<T>);

export const authApi = {
  login(email: string, password: string) {
    return post<{ user: User; token: string }>('/auth/login', { email, password }).then(r => {
      localStorage.setItem(TOKEN_KEY, r.token);
      localStorage.setItem(USER_KEY, JSON.stringify(r.user));
      return r;
    });
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  me() {
    const cached = localStorage.getItem(USER_KEY);
    if (cached) {
      try { return Promise.resolve(JSON.parse(cached) as User); } catch { /* ignore */ }
    }
    return get<User>('/auth/me').then(u => {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      return u;
    });
  },
  listUsers() { return get<User[]>('/auth/users'); },
  isLoggedIn() { return !!localStorage.getItem(TOKEN_KEY); },
  getCachedUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
};

export const projectApi = {
  list() { return get<Project[]>('/projects'); },
  get(id: string) { return get<Project>(`/projects/${id}`); },
  create(data: { name: string; description: string }) { return post<Project>('/projects', data); },
  update(id: string, data: Partial<Project>) { return put<Project>(`/projects/${id}`, data); },
  delete(id: string) { return del<{ success: boolean }>(`/projects/${id}`); },
  listMembers(id: string) { return get<(User & { role: MemberRole })[]>(`/projects/${id}/members`); },
  addMember(id: string, email: string, role: MemberRole) {
    return post<{ success?: boolean }>(`/projects/${id}/members`, { email, role });
  },
  updateMemberRole(id: string, uid: string, role: MemberRole) {
    return put<{ success?: boolean }>(`/projects/${id}/members/${uid}`, { role });
  },
  removeMember(id: string, uid: string) {
    return del<{ success: boolean }>(`/projects/${id}/members/${uid}`);
  },
  listDiagrams(id: string) { return get<Diagram[]>(`/projects/${id}/diagrams`); },
};

export const diagramApi = {
  create(data: { projectId: string; name: string; type: DiagramType; templateId?: string }) {
    return post<Diagram>('/diagrams', data);
  },
  get(id: string) { return get<Diagram>(`/diagrams/${id}`); },
  update(id: string, data: Partial<Diagram>) { return put<Diagram>(`/diagrams/${id}`, data); },
  delete(id: string) { return del<{ success: boolean }>(`/diagrams/${id}`); },
  applyOps(id: string, operations: Operation[]) {
    return post<Diagram>(`/diagrams/${id}/ops`, { operations });
  },
  listVersions(id: string) { return get<DiagramVersion[]>(`/diagrams/${id}/versions`); },
  createVersion(id: string, meta?: { name?: string; message?: string }) {
    return post<DiagramVersion>(`/diagrams/${id}/versions`, meta ?? {});
  },
  restoreVersion(id: string, vid: string) {
    return post<Diagram>(`/diagrams/${id}/versions/${vid}/restore`);
  },
  listComments(id: string) { return get<Comment[]>(`/diagrams/${id}/comments`); },
  createComment(id: string, data: { nodeId?: string; content: string }) {
    return post<Comment>(`/diagrams/${id}/comments`, data);
  },
  addReply(id: string, cid: string, content: string) {
    return post<CommentReply>(`/diagrams/${id}/comments/${cid}/replies`, { content });
  },
  updateComment(id: string, cid: string, data: Partial<Comment>) {
    return patch<Comment>(`/diagrams/${id}/comments/${cid}`, data);
  },
  getEmbed(id: string) {
    return get<{ embedCode: string; sync: boolean }>(`/diagrams/${id}/embed`);
  },
  getPublicEmbed(id: string) { return get<Diagram>(`/diagrams/embed/public/${id}`); },
};

export const templateApi = {
  list(params?: { type?: DiagramType; category?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return get<DiagramTemplate[]>(`/templates${qs ? '?' + qs : ''}`);
  },
  get(id: string) { return get<DiagramTemplate>(`/templates/${id}`); },
  stats() { return get<{ projects: number; diagrams: number; collaborators: number; versions: number }>('/templates/_/stats'); },
};
