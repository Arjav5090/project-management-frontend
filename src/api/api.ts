const API_BASE_URL = "http://localhost:3000"; // Update if deployed

export const api = {
  // ✅ Authentication
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  // ✅ Get Projects (For Assigned Users)
  getProjects: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  // ✅ Create Project (Admin Only)
  createProject: async (token: string, projectData: object) => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(projectData),
    });
    return response.json();
  },

  // ✅ Get Zones for a Project
  getZones: async (token: string, projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/zones/project/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  // ✅ Assign User to Project/Zone (Admin Only)
  assignUser: async (token: string, assignmentData: object) => {
    const response = await fetch(`${API_BASE_URL}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(assignmentData),
    });
    return response.json();
  },

  // ✅ Get Logs for a Project/Zone
  getLogs: async (token: string, projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/logs/project/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  // ✅ Submit Build Log (Supervisor/Foreman)
  submitLog: async (token: string, logData: object) => {
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(logData),
    });
    return response.json();
  },
};
