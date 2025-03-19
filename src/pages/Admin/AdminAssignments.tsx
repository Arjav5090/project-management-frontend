/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react"
import { useAuth } from "../AuthPages/AuthContext"

interface User {
  _id: string
  email: string
  role: "admin" | "supervisor" | "foreman" | "user"
}

interface Assignment {
  _id: string
  projectId: string
  userId: string
  zoneId?: string
  role: string
}

interface Project {
  _id: string
  name: string
}

interface Zone {
  _id: string
  name: string
  projectId: string
}

export default function AdminAssignments() {
  const { token } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    projectId: "",
    userId: "",
    role: "user",
    zoneId: "",
  })

  /**
   * ✅ First fetch Users, Projects, and Assignments
   */
  useEffect(() => {
    async function fetchInitialData() {
      await fetchProjects()
      await fetchUsers()
    }
    fetchInitialData()
  }, [])

  /**
   * ✅ After Users & Projects are fetched, fetch Assignments
   */
  useEffect(() => {
    if (users.length > 0 && projects.length > 0) {
      fetchAssignments()
      setLoading(false)
    }
  }, [users, projects, form.userId, form.projectId, form.zoneId])

  /** ✅ Fetch Projects */
  const fetchProjects = async () => {
    try {
      const response = await fetch("http://localhost:3000/projects", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Error fetching projects:", error)
      setProjects([])
    }
  }

  /** ✅ Fetch Users */
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:3000/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      setUsers([])
    }
  }

  /** ✅ Fetch Assignments (AFTER users & projects exist) */
  const fetchAssignments = async () => {
    try {
      let url = "http://localhost:3000/assignments"

      if (form.userId) {
        url = `http://localhost:3000/assignments/user/${form.userId}`
      } else if (form.projectId && form.zoneId) {
        url = `http://localhost:3000/assignments/project/${form.projectId}/zone/${form.zoneId}`
      } else if (form.projectId) {
        url = `http://localhost:3000/assignments/project/${form.projectId}`
      }



      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.status}`)
      }

      const data = await response.json()
      if (!Array.isArray(data)) throw new Error("Invalid data format")

      setAssignments(data)
    } catch (error) {
      console.error("Error fetching assignments:", error)
      setAssignments([]) // Ensure `assignments` is always an array
    }
  }

  /** ✅ Fetch Zones ONLY when a project is selected */
  const fetchZones = async (projectId: string) => {
    if (!projectId) return

    try {
      const response = await fetch(`http://localhost:3000/zones/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setZones(data)
    } catch (error) {
      console.error("Error fetching zones:", error)
      setZones([])
    }
  }

  /** ✅ Handle project change (Fetch Zones) */
  const handleProjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value
    setForm({ ...form, projectId, zoneId: "" })
    fetchZones(projectId)
  }

  /** ✅ Handle Form Submission */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("http://localhost:3000/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: form.projectId,
          userId: form.userId,
          role: form.role,
          zoneId: form.zoneId || null, // If no zone is selected, send `null`
        }),
      })

      if (!response.ok) throw new Error("Failed to assign user")

      // Reset form after successful submission
      setForm({
        projectId: "",
        userId: "",
        role: "user",
        zoneId: "",
      })

      // Fetch all assignments after adding
      const allAssignmentsResponse = await fetch("http://localhost:3000/assignments", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (allAssignmentsResponse.ok) {
        const data = await allAssignmentsResponse.json()
        setAssignments(data)
      } else {
        fetchAssignments() // Fallback to filtered assignments if all fetch fails
      }
    } catch (error) {
      console.error("Error assigning user:", error)
    }
  }

  const handleDelete = async (assignment: Assignment) => {
    if (!window.confirm("Are you sure you want to remove this assignment?")) return;
  
    try {
      const response = await fetch(
        `http://localhost:3000/assignments/${assignment.projectId}/${assignment.userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (!response.ok) {
        throw new Error("Failed to remove assignment");
      }
  

  
      // ✅ Update state to remove deleted assignment
      setAssignments((prevAssignments) =>
        prevAssignments.filter((a) => a._id !== assignment._id)
      );
  
    } catch (error) {
      console.error("Error removing assignment:", error);
    }
  };
  

  /** ✅ Function to Convert IDs to Names */
  const getUserEmail = (userId: string) => {
    const user = users.find((u) => u._id === userId)
    return user ? user.email : "Unknown User"
  }

  const getUserRole = (userId: string) => {
    const user = users.find((u) => u._id === userId)
    return user ? user.role : "unknown"
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p._id === projectId)
    return project ? project.name : "Unknown Project"
  }

  const getZoneName = (zoneId?: string) => {
    if (!zoneId) return "Project-wide"
    const zone = zones.find((z) => z._id === zoneId)
    return zone ? zone.name : "Unknown Zone"
  }

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "supervisor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "foreman":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Manage Assignments</h1>

      {/* Assignment Form */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Assign User to Project</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Select Project */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>
            <select
              name="projectId"
              value={form.projectId}
              onChange={handleProjectChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Zone (if applicable) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Zone (Optional)</label>
            <select
              name="zoneId"
              value={form.zoneId || ""}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              disabled={!form.projectId}
            >
              <option value="">Assign to entire project</option>
              {zones.length > 0 ? (
                zones.map((zone) => (
                  <option key={zone._id} value={zone._id}>
                    {zone.name}
                  </option>
                ))
              ) : (
                <option disabled>{form.projectId ? "No zones found" : "Select a project first"}</option>
              )}
            </select>
          </div>

          {/* Select User */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
            <select
              name="userId"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Select User</option>
              {users.length > 0 ? (
                users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.email} ({user.role})
                  </option>
                ))
              ) : (
                <option disabled>No users found</option>
              )}
            </select>
          </div>

          {/* Select Role */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignment Role</label>
            <select
              name="role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="supervisor">Supervisor</option>
              <option value="foreman">Foreman</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex justify-end mt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              disabled={!form.projectId || !form.userId}
            >
              Assign User
            </button>
          </div>
        </form>
      </div>

      {/* Assignment List */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Current Assignments
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({assignments.length})</span>
          </h2>

          {/* Show all assignments button */}
          {(form.userId || form.projectId || form.zoneId) && (
            <button
              onClick={async () => {
                try {
                  const response = await fetch("http://localhost:3000/assignments", {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                  if (response.ok) {
                    const data = await response.json()
                    setAssignments(data)
                  }
                } catch (error) {
                  console.error("Error fetching all assignments:", error)
                }
              }}
              className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Show All Assignments
            </button>
          )}
        </div>

        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-left">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {assignments.map((assignment) => (
                  <tr key={assignment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {getUserEmail(assignment.userId).substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">
                            {getUserEmail(assignment.userId)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            User type: {getUserRole(assignment.userId)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(assignment.role)}`}
                      >
                        {assignment.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {getProjectName(assignment.projectId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {getZoneName(assignment.zoneId)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDelete(assignment)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assignments found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first assignment using the form above</p>
          </div>
        )}
      </div>
    </div>
  )
}

