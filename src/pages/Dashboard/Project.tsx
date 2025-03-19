/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../AuthPages/AuthContext";
import { useNavigate } from "react-router";
import {
  PlusCircle,
  Building2,
  Layers,
  Map,
  User,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Assignment {
  _id: string;
  projectId: string;
  userId: string;
  zoneId?: string;
  role: "supervisor" | "foreman" | "user";
}

interface Project {
  _id: string;
  name: string;
}

interface Zone {
  _id: string;
  name: string;
  projectId: string;
}

export default function ProjectDashboard() {
  const { user, token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  /** ✅ Fetch all projects if Admin, otherwise fetch assignments */
  const fetchData = useCallback(async () => {
    if (!user) {
      console.warn("User not found. Skipping fetch.");
      return;
    }

    try {
      if (user.role === "admin") {
        // ✅ Fetch ALL projects for Admin

        const response = await fetch("http://localhost:3000/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
          throw new Error(`Failed to fetch projects: ${response.status}`);
        const data = await response.json();

        setProjects(data);
        setLoading(false);
      } else {
        // ✅ Fetch user assignments

        const response = await fetch(
          `http://localhost:3000/assignments/user/${user._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok)
          throw new Error(`Failed to fetch assignments: ${response.status}`);
        const data = await response.json();

        if (!Array.isArray(data))
          throw new Error("Invalid assignments data format");
        setAssignments(data);

        if (data.length > 0) {
          // Filter out assignments pointing to deleted projects
          const validAssignments = data.filter((a) => a.projectId);
          setAssignments(validAssignments);
          fetchProjectsAndZones(validAssignments);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  }, [user, token]); // ✅ `useCallback` to prevent infinite re-renders

  /** ✅ Fetch projects and zones based on assignments */
  const fetchProjectsAndZones = useCallback(
    async (assignments: Assignment[]) => {
      try {
        const uniqueProjectIds = [
          ...new Set(assignments.map((a) => a.projectId)),
        ];

        /** Fetch Projects */
        const projectResponses = await Promise.all(
          uniqueProjectIds.map((id) =>
            fetch(`http://localhost:3000/projects/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );

        const projectData = await Promise.all(
          projectResponses.map((res) => res.json())
        );
        const validProjects = projectData.filter((p) => p && p._id);

        setProjects(validProjects);

        /** Fetch Zones */
        const zoneResponses = await Promise.all(
          assignments
            .filter((a) => a.zoneId)
            .map((a) =>
              fetch(`http://localhost:3000/zones/${a.zoneId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            )
        );

        const zoneData = await Promise.all(
          zoneResponses.map((res) => res.json())
        );

        setZones(zoneData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects or zones:", error);
        setLoading(false);
      }
    },
    [token]
  ); // ✅ Memoized function

  /** ✅ Fetch data on mount */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper function to get user role for a specific project
  const getUserRoleForProject = (projectId: string) => {
    const assignment = assignments.find((a) => a.projectId === projectId);
    return assignment?.role || "user";
  };

  // Get role badge color based on role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-gradient-to-r from-brand-600 to-brand-400 text-white";
      case "supervisor":
        return "bg-gradient-to-r from-amber-600 to-amber-400 text-white";
      case "foreman":
        return "bg-gradient-to-r from-emerald-600 to-emerald-400 text-white";
      default:
        return "bg-gradient-to-r from-slate-600 to-slate-400 text-white";
    }
  };

  // Get zones for a specific project
  const getZonesForProject = (projectId: string) => {
    return zones.filter((zone) => zone.projectId === projectId);
  };

  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative flex flex-col items-center gap-6">
            <div className="absolute inset-0 -z-10 h-full w-full rounded-full bg-brand/20 blur-3xl"></div>
            <div className="relative">
              <div className="absolute inset-0 h-20 w-20 rounded-full bg-brand/30 animate-ping"></div>
              <Loader2 className="h-20 w-20 text-brand animate-spin relative" />
            </div>
            <h2 className="text-2xl font-medium text-slate-700 dark:text-slate-300">
              Loading your projects...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative mb-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-brand/20 rounded-full blur-3xl -z-10"></div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-1 bg-brand rounded-full"></div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                  {user?.role === "admin"
                    ? "All Projects"
                    : "Your Assigned Projects"}
                </h1>
                <div className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full bg-brand/10 text-brand"></div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg pl-4">
                {user?.role === "admin"
                  ? `There are ${projects.length} total projects available.`
                  : `You have access to ${projects.length} project${
                      projects.length !== 1 ? "s" : ""
                    } and ${zones.length} zone${
                      zones.length !== 1 ? "s" : ""
                    }.`}
              </p>
            </div>

            {user?.role === "admin" && (
              <button
                onClick={() => {
                  navigate("/admin/projects");
                }}
                className="group relative inline-flex items-center px-6 py-3 bg-brand text-white rounded-xl bg-brand-600 transition-all duration-300 shadow-lg hover:shadow-brand/30 overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-brand-800 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <PlusCircle className="h-5 w-5 mr-2 relative z-10" />
                <span className="relative z-10">Create New Project</span>
              </button>
            )}
          </div>

          <div className="h-1 w-full bg-gradient-to-r from-brand/80 via-brand to-brand/20 rounded-full"></div>
        </div>

        {projects.length === 0 ? (
          <div className="relative flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent rounded-2xl -z-10"></div>
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-brand/10 rounded-full blur-xl"></div>
              <Building2 className="h-24 w-24 text-brand dark:text-brand/80 relative" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
              No Projects Found
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-center max-w-md text-lg">
              {user?.role === "admin"
                ? "No projects have been created yet. Use the 'Create New Project' button to add one."
                : assignments.length > 0 && projects.length === 0
                ? "Some of your assigned projects may have been deleted. Contact your administrator."
                : "You don't have any assigned projects. Please contact your administrator for access."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => {
              if (!project || !project._id) return null; // ✅ Ensure valid project before rendering

              const projectZones = getZonesForProject(project._id);
              const role =
                user?.role === "admin"
                  ? "admin"
                  : getUserRoleForProject(project._id);
              const isHovered = hoverIndex === index;

              return (
                <div
                  key={project._id}
                  className="group relative bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1"
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                  <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand dark:group-hover:text-brand/90 transition-colors duration-300">
                        {project.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        ID:{" "}
                        {project?._id
                          ? project._id.substring(0, 8) + "..."
                          : "Unknown"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        role
                      )}`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  </div>

                  <div className="p-6">
                    {projectZones.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300 font-medium">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-brand/10 text-brand mr-3">
                            <Map className="h-4 w-4" />
                          </div>
                          <span>Assigned Zones ({projectZones.length})</span>
                        </div>
                        <ul className="space-y-3 pl-4">
                          {projectZones.map((zone) => (
                            <li
                              key={zone._id}
                              className="text-sm flex items-center text-slate-700 dark:text-slate-300 group/zone"
                            >
                              <span className="h-2.5 w-2.5 rounded-full bg-brand mr-3 group-hover/zone:animate-pulse"></span>
                              {zone.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-brand/10 text-brand mr-3">
                          <User className="h-4 w-4" />
                        </div>
                        <span>Project-level access</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700/50">
                    <button
                      onClick={async () => {
                        try {
                          if (!project?._id) {
                            console.error(
                              "Project ID is missing. Cannot fetch logs."
                            );
                            alert(
                              "This project no longer exists or was deleted."
                            );
                            return;
                          }
                          const response = await fetch(
                            `http://localhost:3000/build-logs/zones/project/${project._id}`,
                            {
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );

                          if (!response.ok)
                            throw new Error("Failed to fetch zones");

                          const zonesData = await response.json();

                          if (
                            Array.isArray(zonesData) &&
                            zonesData.length > 0
                          ) {
                            navigate(`/build-logs/zone/${zonesData[0]._id}`);
                          } else {
                            navigate(`/build-logs/project/${project._id}`);
                          }
                        } catch (error) {
                          console.error("Error checking zones:", error);
                          alert("Failed to check zones. Please try again.");
                        }
                      }}
                      className="relative py-4 px-4 text-sm font-medium text-slate-700 hover:text-brand dark:text-slate-300 dark:hover:text-brand/90 flex items-center justify-center transition-colors overflow-hidden group/btn"
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-brand/10 to-brand/5 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></span>
                      <Layers
                        className={`h-4 w-4 mr-2 transition-transform duration-300 ${
                          isHovered ? "scale-110" : ""
                        }`}
                      />
                      <span className="relative">Manage Build Logs</span>
                    </button>
                    <button className="relative py-4 px-4 text-sm font-medium text-slate-700 hover:text-brand dark:text-slate-300 dark:hover:text-brand/90 flex items-center justify-center transition-colors overflow-hidden group/btn">
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-brand/5 to-brand/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></span>
                      <span className="relative">View Details</span>
                      <ChevronRight
                        className={`h-4 w-4 ml-2 transition-all duration-300 ${
                          isHovered ? "translate-x-1" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
