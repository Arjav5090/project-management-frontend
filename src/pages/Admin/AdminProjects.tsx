/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthPages/AuthContext";
import { Link } from "react-router";

interface Project {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed";
  createdBy: string;
}

export default function AdminProjects() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<Partial<Project>>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "active",
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("http://localhost:3000/projects", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include token
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
   
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submission (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const method = editingProject ? "PATCH" : "POST";
      const url = editingProject
        ? `http://localhost:3000/projects/${editingProject._id}`
        : "http://localhost:3000/projects";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, createdBy: user._id }),
      });

      if (!response.ok) throw new Error("Failed to save project");

      fetchProjects();
      setForm({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "active",
      });
      setEditingProject(null);
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  // Delete project
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    try {
      await fetch(`http://localhost:3000/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  // Set project for editing
  const handleEdit = (project: Project) => {
    setForm(project);
    setEditingProject(project);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Manage Projects
      </h1>

      {/* Create / Edit Project Form */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          {editingProject ? "Edit Project" : "Create New Project"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Project Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Project Name"
              value={form.name || ""}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Description"
              value={form.description || ""}
              onChange={handleChange}
              required
              rows={3}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={form.startDate || ""}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={form.endDate || ""}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              name="status"
              value={form.status || "active"}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex justify-end mt-2">
            {editingProject && (
              <button
                type="button"
                onClick={() => {
                  setEditingProject(null);
                  setForm({
                    name: "",
                    description: "",
                    startDate: "",
                    endDate: "",
                    status: "active",
                  });
                }}
                className="mr-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {editingProject ? "Update Project" : "Create Project"}
            </button>
          </div>
        </form>
      </div>

      {/* Project List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead className="border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-5 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400">
                  Project
                </th>
                <th className="px-5 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400">
                  Timeline
                </th>
                <th className="px-5 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400">
                  Status
                </th>
                <th className="px-5 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {Array.isArray(projects) && projects.length > 0 ? (
                projects.map((project) => (
                  <tr
                    key={project._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 text-sm dark:text-white/90">
                          {project.name}
                        </span>
                        <span className="text-gray-500 text-xs dark:text-gray-400 mt-1 line-clamp-2">
                          {project.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-start text-sm dark:text-gray-400">
                      <div className="flex flex-col">
                        <span className="text-xs">
                          <span className="font-medium">Start:</span>{" "}
                          {formatDate(project.startDate)}
                        </span>
                        <span className="text-xs mt-1">
                          <span className="font-medium">End:</span>{" "}
                          {formatDate(project.endDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-start text-sm dark:text-gray-400">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${
                          project.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {project.status.charAt(0).toUpperCase() +
                          project.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-start text-sm dark:text-gray-400">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(project)}
                          className="px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(project._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                        <Link
                          to={`/admin/projects/${project._id}/zones`}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Manage Zones
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
