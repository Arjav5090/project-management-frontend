import React, { useEffect, useState, useCallback } from "react"
import { useParams } from "react-router"
import Input from "../../components/form/input/InputField"
import Button from "../../components/ui/button/Button"

interface Zone {
  _id: string
  name: string
  description: string
  projectId: string
}

export default function AdminZones() {
  const { projectId } = useParams<{ projectId: string }>() // ✅ Strongly typed param
  const [zones, setZones] = useState<Zone[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [projectName, setProjectName] = useState("Project")

  // ✅ Fetch zones with proper typing
  const fetchZones = useCallback(async () => {
    setLoading(true)
    try {
      // First fetch project details to get the name
      const projectResponse = await fetch(`http://localhost:3000/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      if (projectResponse.ok) {
        const projectData = await projectResponse.json()
        setProjectName(projectData.name || "Project")
      }

      // Then fetch zones
      const response = await fetch(`http://localhost:3000/zones/project/${projectId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      const data: Zone[] = await response.json() // ✅ Explicitly define response type
      if (!response.ok) throw new Error("Failed to fetch zones")
      setZones(data)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  // ✅ Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    try {
      const method = editingZone ? "PATCH" : "POST"
      const url = editingZone ? `http://localhost:3000/zones/${editingZone._id}` : "http://localhost:3000/zones"
      const body = JSON.stringify({ name, description, projectId })

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body,
      })

      if (!response.ok) throw new Error("Failed to save zone")

      setName("")
      setDescription("")
      setEditingZone(null)
      fetchZones() // Refresh the list
    } catch (err: unknown) {
      setError((err as Error).message)
    }
  }

  // ✅ Handle delete with proper confirmation
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this zone?")) return
    try {
      await fetch(`http://localhost:3000/zones/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      fetchZones()
    } catch (err: unknown) {
      setError((err as Error).message)
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingZone(null)
    setName("")
    setDescription("")
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      {/* Header with breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>Projects</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mx-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 dark:text-gray-300">{projectName}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mx-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-gray-900 dark:text-white">Zones</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Zones</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Create and manage zones for {projectName}</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Zone Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {editingZone ? "Edit Zone" : "Create New Zone"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Zone Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Zone Name" className="w-full" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            {editingZone && (
              <Button  onClick={handleCancelEdit} className="bg-gray-500 hover:bg-gray-600">
                Cancel
              </Button>
            )}
            <Button >{editingZone ? "Update Zone" : "Create Zone"}</Button>
          </div>
        </form>
      </div>

      {/* Zone List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Zones
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({zones.length})</span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : zones.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {zones.map((zone) => (
              <div
                key={zone._id}
                className="p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{zone.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{zone.description}</p>
                </div>
                <div className="flex space-x-2 sm:flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingZone(zone)
                      setName(zone.name)
                      setDescription(zone.description)
                    }}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    Edit
                  </Button>
                  <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => handleDelete(zone._id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No zones found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first zone to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

