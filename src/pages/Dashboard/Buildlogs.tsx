/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../AuthPages/AuthContext";
import { useParams } from "react-router";

interface PipelineDetail {
  length: number;
  material: string;
}

interface Assignment {
  projectId: string;
  zoneId?: string;
}


interface BuildLog {
  _id: string;
  projectId: string;
  site: string;
  description: string;
  notes: string;
  totalLength: number;
  roadRestoration: number;
  hscChambers: number;
  manholes: number;
  pipelineDetails: PipelineDetail[];
  createdAt: string;
  updatedAt: string;
  date: string; // Added log date field
}

type NewBuildLog = Omit<BuildLog, "_id" | "projectId"> & {
  projectId?: string;
};

interface AlertProps {
  type: "success" | "error" | "info";
  message: string;
}

export default function BuildLogs() {
  const { user, token } = useAuth();
  const params = useParams();

  const zoneId = params?.zoneId as string; // ✅ Extract zoneId
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const [zones, setZones] = useState<{ _id: string; name: string }[]>([]);

  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [newLog, setNewLog] = useState<NewBuildLog>({
    site: "",
    description: "",
    notes: "",
    totalLength: 0,
    roadRestoration: 0,
    hscChambers: 0,
    manholes: 0,
    pipelineDetails: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    date: new Date().toISOString().split("T")[0], // Initialize with today's date
  });
  const [editingLog, setEditingLog] = useState<BuildLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newPipelineDetail, setNewPipelineDetail] = useState<PipelineDetail>({
    length: 0,
    material: "",
  });
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Show alert function
  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlert({ type, message });
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const fetchBuildLogs = useCallback(async () => {
    if (!projectId) {
      console.error("Project ID is undefined. Skipping fetch.");
      return;
    }
  
    setLoading(true);
  
    try {
      let endpoint = "";
      let method: "GET" | "POST" = "GET";
      let body: string | null = null;
  
      let assignedZones: string[] = [];
  
      if (user?.role === "admin") {
        endpoint = `http://localhost:3000/build-logs/project/${projectId}`;
      } else {
        const assignmentRes = await fetch(
          `http://localhost:3000/assignments/user/${user?._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        if (!assignmentRes.ok) throw new Error("Failed to fetch assignments");
        const assignments: Assignment[] = await assignmentRes.json();

  
        assignedZones = assignments
          .filter((a) => a.projectId === projectId && a.zoneId)
          .map((a) => a.zoneId as string);
  
        if (assignedZones.length === 0) {
          endpoint = `http://localhost:3000/build-logs/project/${projectId}`;
        } else if (assignedZones.length === 1) {
          endpoint = `http://localhost:3000/build-logs/zone/${assignedZones[0]}`;
        } else {
          endpoint = `http://localhost:3000/build-logs/multi-zone`;
          method = "POST";
          body = JSON.stringify({ zoneIds: assignedZones });
        }
      }
  
      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(method === "POST" && { "Content-Type": "application/json" }),
        },
        body,
      });
  
      if (!response.ok) throw new Error("Failed to fetch logs");
  
      const data = await response.json();
  
      if (!Array.isArray(data)) throw new Error("Invalid build logs format");
  
      setBuildLogs(
        data.map((log: BuildLog) => ({
          ...log,
          pipelineDetails: log.pipelineDetails || [],
        }))
      );
  
      showAlert("success", "Build logs loaded successfully");
    } catch (error) {
      console.error("Error fetching build logs:", error);
      showAlert("error", "Failed to load build logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [projectId, token, user?._id, user?.role]);
  

  /** ✅ Validate form */
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newLog.site.trim()) errors.site = "Site location is required";
    if (!newLog.description.trim())
      errors.description = "Description is required";
    if (newLog.totalLength <= 0)
      errors.totalLength = "Total length must be greater than 0";
    if (newLog.roadRestoration < 0)
      errors.roadRestoration = "Road restoration cannot be negative";
    if (newLog.hscChambers < 0)
      errors.hscChambers = "HSC chambers cannot be negative";
    if (newLog.manholes < 0) errors.manholes = "Manholes cannot be negative";
    if (!newLog.date) errors.date = "Log date is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** ✅ Handle Create or Update Log */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showAlert("error", "Please fix the errors in the form");
      return;
    }

    if (zones.length > 0 && !selectedZone) {
      showAlert("error", "Please select a zone");
      return;
    }

    setLoading(true);
    const url = editingLog
      ? `http://localhost:3000/build-logs/${editingLog._id}`
      : "http://localhost:3000/build-logs";
    const method = editingLog ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newLog,
          projectId,
          zoneId: zones.length > 0 ? selectedZone : undefined, // ✅ Ensure zoneId is included
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to save build log");

      showAlert(
        "success",
        editingLog
          ? "Build log updated successfully"
          : "Build log created successfully"
      );

      setNewLog({
        site: "",
        description: "",
        notes: "",
        totalLength: 0,
        roadRestoration: 0,
        hscChambers: 0,
        manholes: 0,
        pipelineDetails: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        date: new Date().toISOString().split("T")[0],
      });

      setEditingLog(null);
      setIsFormOpen(false);

      // ✅ Fetch logs again after creating
      fetchBuildLogs();
    } catch (error) {
      console.error("Error saving build log:", error);
      showAlert("error", "Failed to save build log. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /** ✅ Handle Delete Log */
  const handleDelete = async (logId: string) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/build-logs/${logId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete build log");

      showAlert("success", "Build log deleted successfully");
      fetchBuildLogs();
    } catch (error) {
      console.error("Error deleting build log:", error);
      showAlert("error", "Failed to delete build log. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /** ✅ Add Pipeline Detail */
  const addPipelineDetail = () => {
    if (newPipelineDetail.length <= 0 || !newPipelineDetail.material) {
      showAlert("error", "Please enter valid pipeline length and material");
      return;
    }

    setNewLog({
      ...newLog,
      pipelineDetails: [...newLog.pipelineDetails, { ...newPipelineDetail }],
    });

    setNewPipelineDetail({ length: 0, material: "" });
    showAlert("info", "Pipeline detail added");
  };

  /** ✅ Remove Pipeline Detail */
  const removePipelineDetail = (index: number) => {
    setNewLog({
      ...newLog,
      pipelineDetails: newLog.pipelineDetails.filter((_, i) => i !== index),
    });
    showAlert("info", "Pipeline detail removed");
  };

  /** ✅ Set Editing Log */
  const startEditing = (log: BuildLog) => {
    setEditingLog(log);
    setNewLog({
      site: log.site || "",
      description: log.description,
      notes: log.notes,
      totalLength: log.totalLength,
      roadRestoration: log.roadRestoration,
      hscChambers: log.hscChambers,
      manholes: log.manholes,
      pipelineDetails: [...log.pipelineDetails],
      createdAt: log.createdAt,
      updatedAt: new Date().toISOString(),
      date: log.date || new Date(log.createdAt).toISOString().split("T")[0],
    });
    setIsFormOpen(true);
    setFormErrors({});
  };

  /** ✅ Calculate Total Pipeline Length */
  const calculateTotalPipelineLength = (details: PipelineDetail[]): number => {
    return details.reduce((total, detail) => total + detail.length, 0);
  };

  /** ✅ Toggle expanded log details */
  const toggleExpandLog = (logId: string) => {
    if (expandedLog === logId) {
      setExpandedLog(null);
    } else {
      setExpandedLog(logId);
    }
  };

  /** ✅ Format date for display */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    if (!zoneId) return; // ✅ Prevent unnecessary API calls

    const fetchProjectId = async () => {
      try {
        const response = await fetch(`http://localhost:3000/zones/${zoneId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch projectId");

        const data = await response.json();
        if (data.projectId) {
          setProjectId(data.projectId); // ✅ Now actually used
        }
      } catch (error) {
        console.error("Error fetching projectId from zone:", error);
      }
    };

    fetchProjectId();
  }, [zoneId, token]);

  useEffect(() => {
    if (!projectId) return; // ✅ Prevent fetching if projectId is missing

    const fetchZones = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/zones/project/${projectId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch zones");

        const data = await response.json();

        setZones(data); // ✅ Store zones in state
      } catch (error) {
        console.error("Error fetching zones:", error);
      }
    };

    fetchZones();
  }, [projectId, token]); // ✅ Runs when `projectId` changes

  useEffect(() => {
    if (zoneId && !projectId) {
      return; // ❌ Prevent fetching logs too early
    }

    if (zoneId || projectId) {
      fetchBuildLogs();
    }
  }, [fetchBuildLogs, projectId, zoneId]); // ✅ Runs only after projectId is set

  useEffect(() => {
    // Update total length when pipeline details change if auto-calculation is enabled
    const totalPipelineLength = calculateTotalPipelineLength(
      newLog.pipelineDetails
    );
    if (
      newLog.pipelineDetails.length > 0 &&
      totalPipelineLength !== newLog.totalLength
    ) {
      // Only suggest the update, don't force it
      showAlert(
        "info",
        `Pipeline details total ${totalPipelineLength}m. Update total length?`
      );
    }
  }, [newLog.pipelineDetails]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Alert Component */}
      {alert && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl max-w-md transform transition-all duration-500 ease-in-out animate-fade-in ${
            alert.type === "success"
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-700 dark:from-green-900/70 dark:to-emerald-900/70 dark:text-green-200"
              : alert.type === "error"
              ? "bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-700 dark:from-red-900/70 dark:to-rose-900/70 dark:text-red-200"
              : "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 text-blue-700 dark:from-blue-900/70 dark:to-indigo-900/70 dark:text-blue-200"
          }`}
        >
          <div className="flex items-center">
            <div className="mr-3">
              {alert.type === "success" ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : alert.type === "error" ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <div>
              <p className="font-medium">{alert.message}</p>
            </div>
            <button
              onClick={() => setAlert(null)}
              className="ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="bg-gradient-to-r from-brand-800 to-indigo-800 p-6 rounded-2xl shadow-lg text-white mb-6 dark:from-brand-800 dark:to-indigo-800">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Build Logs Dashboard
          </h1>
          <p className="text-brand-100 dark:text-brand-200 max-w-2xl">
            Track and manage construction progress with detailed build logs.
            Record pipeline installations, road restorations, and infrastructure
            components.
          </p>

          {["admin", "supervisor", "foreman"].includes(user?.role || "") && (
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="mt-4 px-6 py-3 bg-white text-brand-700 rounded-lg transition-all duration-300 flex items-center justify-center hover:bg-brand-50 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              {editingLog ? "Edit Build Log" : "Add New Build Log"}
            </button>
          )}
        </div>

        {/* Project Summary Cards */}
        {buildLogs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-100 shadow-md dark:from-blue-900/40 dark:to-cyan-900/40 dark:border-blue-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200 rounded-bl-full opacity-30 dark:bg-blue-600 transform transition-transform duration-300 group-hover:scale-125"></div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1 relative z-10">
                Total Pipeline Length
              </h4>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-200 relative z-10">
                {buildLogs.reduce((total, log) => total + log.totalLength, 0)} m
              </p>
              <div className="absolute bottom-2 right-2 text-blue-300 dark:text-blue-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-xl border border-emerald-100 shadow-md dark:from-emerald-900/40 dark:to-green-900/40 dark:border-emerald-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-200 rounded-bl-full opacity-30 dark:bg-emerald-600 transform transition-transform duration-300 group-hover:scale-125"></div>
              <h4 className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1 relative z-10">
                Road Restoration
              </h4>
              <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-200 relative z-10">
                {buildLogs.reduce(
                  (total, log) => total + log.roadRestoration,
                  0
                )}{" "}
                m²
              </p>
              <div className="absolute bottom-2 right-2 text-emerald-300 dark:text-emerald-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl border border-amber-100 shadow-md dark:from-amber-900/40 dark:to-yellow-900/40 dark:border-amber-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200 rounded-bl-full opacity-30 dark:bg-amber-600 transform transition-transform duration-300 group-hover:scale-125"></div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1 relative z-10">
                HSC Chambers
              </h4>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-200 relative z-10">
                {buildLogs.reduce((total, log) => total + log.hscChambers, 0)}
              </p>
              <div className="absolute bottom-2 right-2 text-amber-300 dark:text-amber-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-br from-fuchsia-50 to-brand-50 p-5 rounded-xl border border-fuchsia-100 shadow-md dark:from-fuchsia-900/40 dark:to-brand-900/40 dark:border-fuchsia-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-fuchsia-200 rounded-bl-full opacity-30 dark:bg-fuchsia-600 transform transition-transform duration-300 group-hover:scale-125"></div>
              <h4 className="text-sm font-medium text-fuchsia-800 dark:text-fuchsia-300 mb-1 relative z-10">
                Manholes
              </h4>
              <p className="text-3xl font-bold text-fuchsia-900 dark:text-fuchsia-200 relative z-10">
                {buildLogs.reduce((total, log) => total + log.manholes, 0)}
              </p>
              <div className="absolute bottom-2 right-2 text-fuchsia-300 dark:text-fuchsia-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Add Build Log Form (Only Admin, Supervisor, Foreman) */}
      {isFormOpen &&
        ["admin", "supervisor", "foreman"].includes(user?.role || "") && (
          <div className="bg-white shadow-xl rounded-2xl p-6 mb-8 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-fade-in-down">
            <h2 className="text-xl font-semibold mb-6 dark:text-white flex items-center border-b pb-4 border-gray-200 dark:border-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2 text-brand-600 dark:text-brand-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              {editingLog ? "Edit Build Log" : "Add New Build Log"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Site Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter site location..."
                      value={newLog.site}
                      onChange={(e) => {
                        setNewLog({ ...newLog, site: e.target.value });
                        if (formErrors.site) {
                          setFormErrors({ ...formErrors, site: "" });
                        }
                      }}
                      className={`w-full p-3 border ${
                        formErrors.site
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                      } rounded-lg focus:ring-2 focus:ring-brnad-500 focus:border-brand-500 dark:text-white transition-colors`}
                    />
                    {formErrors.site && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {formErrors.site}
                      </p>
                    )}
                  </div>
                  {zones.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Zone <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedZone || ""}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select a Zone</option>
                        {zones.map((zone) => (
                          <option key={zone._id} value={zone._id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter build description..."
                      value={newLog.description}
                      onChange={(e) => {
                        setNewLog({ ...newLog, description: e.target.value });
                        if (formErrors.description) {
                          setFormErrors({ ...formErrors, description: "" });
                        }
                      }}
                      className={`w-full p-3 border ${
                        formErrors.description
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                      } rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:text-white transition-colors`}
                    />
                    {formErrors.description && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {formErrors.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Log Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newLog.date}
                      onChange={(e) => {
                        setNewLog({ ...newLog, date: e.target.value });
                        if (formErrors.logDate) {
                          setFormErrors({ ...formErrors, date: "" });
                        }
                      }}
                      className={`w-full p-3 border ${
                        formErrors.logDate
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                      } rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:text-white transition-colors`}
                    />
                    {formErrors.logDate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {formErrors.logDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      placeholder="Enter build notes..."
                      value={newLog.notes}
                      onChange={(e) =>
                        setNewLog({ ...newLog, notes: e.target.value })
                      }
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Length (m) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Total Length"
                        value={newLog.totalLength}
                        onChange={(e) => {
                          setNewLog({
                            ...newLog,
                            totalLength: Number(e.target.value),
                          });
                          if (formErrors.totalLength) {
                            setFormErrors({ ...formErrors, totalLength: "" });
                          }
                        }}
                        className={`w-full p-3 border ${
                          formErrors.totalLength
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                            : "border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                        } rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:text-white transition-colors`}
                      />
                      {formErrors.totalLength && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.totalLength}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Road Restoration (m²)
                      </label>
                      <input
                        type="number"
                        placeholder="Road Restoration"
                        value={newLog.roadRestoration}
                        onChange={(e) => {
                          setNewLog({
                            ...newLog,
                            roadRestoration: Number(e.target.value),
                          });
                          if (formErrors.roadRestoration) {
                            setFormErrors({
                              ...formErrors,
                              roadRestoration: "",
                            });
                          }
                        }}
                        className={`w-full p-3 border ${
                          formErrors.roadRestoration
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                            : "border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                        } rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:text-white transition-colors`}
                      />
                      {formErrors.roadRestoration && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.roadRestoration}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        HSC Chambers
                      </label>
                      <input
                        type="number"
                        placeholder="HSC Chambers"
                        value={newLog.hscChambers}
                        onChange={(e) => {
                          setNewLog({
                            ...newLog,
                            hscChambers: Number(e.target.value),
                          });
                          if (formErrors.hscChambers) {
                            setFormErrors({ ...formErrors, hscChambers: "" });
                          }
                        }}
                        className={`w-full p-3 border ${
                          formErrors.hscChambers
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                            : "border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                        } rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:text-white transition-colors`}
                      />
                      {formErrors.hscChambers && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.hscChambers}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Manholes
                      </label>
                      <input
                        type="number"
                        placeholder="Manholes"
                        value={newLog.manholes}
                        onChange={(e) => {
                          setNewLog({
                            ...newLog,
                            manholes: Number(e.target.value),
                          });
                          if (formErrors.manholes) {
                            setFormErrors({ ...formErrors, manholes: "" });
                          }
                        }}
                        className={`w-full p-3 border ${
                          formErrors.manholes
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                            : "border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                        } rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:text-white transition-colors`}
                      />
                      {formErrors.manholes && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.manholes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pipeline Details
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="number"
                        placeholder="Length (m)"
                        value={newPipelineDetail.length || ""}
                        onChange={(e) =>
                          setNewPipelineDetail({
                            ...newPipelineDetail,
                            length: Number(e.target.value),
                          })
                        }
                        className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Material"
                        value={newPipelineDetail.material}
                        onChange={(e) =>
                          setNewPipelineDetail({
                            ...newPipelineDetail,
                            material: e.target.value,
                          })
                        }
                        className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addPipelineDetail}
                      className="w-full p-2 bg-gradient-to-r from-indigo-500 to-brand-500 hover:from-indigo-600 hover:to-brand-600 text-white rounded-lg transition-colors dark:from-indigo-600 dark:to-brand-600 dark:hover:from-indigo-700 dark:hover:to-brand-700 flex items-center justify-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Add Pipeline Detail
                    </button>
                  </div>
                </div>
              </div>

              {/* Pipeline Details List */}
              {newLog.pipelineDetails.length > 0 && (
                <div className="mt-4 bg-gradient-to-r from-gray-50 to-indigo-50 p-4 rounded-lg dark:from-gray-800 dark:to-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 shadow-inner">
                  <h3 className="text-md font-medium mb-3 flex items-center text-indigo-700 dark:text-indigo-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    Pipeline Details
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                    <table className="min-w-full divide-y divide-indigo-200 dark:divide-indigo-800/50">
                      <thead className="bg-indigo-100 dark:bg-indigo-900/30">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider dark:text-indigo-300">
                            Length (m)
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider dark:text-indigo-300">
                            Material
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-indigo-700 uppercase tracking-wider dark:text-indigo-300">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-indigo-200 dark:bg-gray-800 dark:divide-indigo-800/50">
                        {newLog.pipelineDetails.map((detail, index) => (
                          <tr
                            key={index}
                            className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          >
                            <td className="px-4 py-2 whitespace-nowrap dark:text-white">
                              {detail.length}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap dark:text-white">
                              {detail.material}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-right">
                              <button
                                type="button"
                                onClick={() => removePipelineDetail(index)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Total pipeline length:{" "}
                    {calculateTotalPipelineLength(newLog.pipelineDetails)}m
                    {calculateTotalPipelineLength(newLog.pipelineDetails) !==
                      newLog.totalLength && (
                      <button
                        type="button"
                        onClick={() =>
                          setNewLog({
                            ...newLog,
                            totalLength: calculateTotalPipelineLength(
                              newLog.pipelineDetails
                            ),
                          })
                        }
                        className="ml-2 text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 underline text-xs"
                      >
                        Update total length
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingLog(null);
                    setNewLog({
                      site: "",
                      description: "",
                      notes: "",
                      totalLength: 0,
                      roadRestoration: 0,
                      hscChambers: 0,
                      manholes: 0,
                      pipelineDetails: [],
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      date: new Date().toISOString().split("T")[0],
                    });
                    setFormErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 dark:from-brand-700 dark:to-indigo-700 dark:hover:from-brand-800 dark:hover:to-indigo-800 flex items-center justify-center disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>{editingLog ? "Update Log" : "Create Log"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      {/* ✅ Display Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
        {loading && !isFormOpen ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : buildLogs.length > 0 ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-brand-100 to-indigo-100 dark:from-brand-900/40 dark:to-indigo-900/40 text-left">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-brand-700 uppercase tracking-wider dark:text-brand-300">
                      Date
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-brand-700 uppercase tracking-wider dark:text-brand-300">
                      Site
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-brand-700 uppercase tracking-wider dark:text-brand-300">
                      Description
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-brand-700 uppercase tracking-wider dark:text-brand-300">
                      Total Length
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-brand-700 uppercase tracking-wider dark:text-brand-300">
                      Road Restoration
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-brand-700 uppercase tracking-wider dark:text-brand-300">
                      HSC Chambers
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-brand-700 uppercase tracking-wider dark:text-brand-300">
                      Manholes
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-brand-700 uppercase tracking-wider dark:text-brand-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {buildLogs.map((log) => (
                    <React.Fragment key={log._id}>
                      <tr
                        className={`hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors cursor-pointer ${
                          expandedLog === log._id
                            ? "bg-brand-50 dark:bg-brand-900/20"
                            : ""
                        }`}
                        onClick={() => toggleExpandLog(log._id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white">
                          {formatDate(log.date || log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white">
                          {log.site || "N/A"}
                        </td>
                        <td className="px-6 py-4 dark:text-white">
                          {log.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white">
                          {log.totalLength} m
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white">
                          {log.roadRestoration} m²
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white">
                          {log.hscChambers}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white">
                          {log.manholes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {["admin", "supervisor", "foreman"].includes(
                            user?.role || ""
                          ) && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(log);
                                }}
                                className="px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(log._id);
                                }}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandLog(log._id);
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            {expandedLog === log._id ? "Hide" : "Details"}
                          </button>
                        </td>
                      </tr>
                      {expandedLog === log._id && (
                        <tr className="bg-brand-50 dark:bg-brand-900/10">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-brand-700 dark:text-brand-300 mb-2">
                                  Notes
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                  {log.notes || "No notes available"}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium text-brand-700 dark:text-brand-300 mb-2">
                                  Pipeline Details
                                </h4>
                                {Array.isArray(log.pipelineDetails) &&
                                log.pipelineDetails.length > 0 ? (
                                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-brand-200 dark:border-brand-800/50 overflow-hidden">
                                    <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-800/50">
                                      <thead className="bg-brand-100 dark:bg-brand-900/30">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-brand-700 uppercase tracking-wider dark:text-brand-300">
                                            Length (m)
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-brand-700 uppercase tracking-wider dark:text-brand-300">
                                            Material
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-brand-200 dark:divide-brand-800/50">
                                        {log.pipelineDetails.map(
                                          (detail, index) => (
                                            <tr
                                              key={index}
                                              className="hover:bg-brand-50 dark:hover:bg-brand-900/20"
                                            >
                                              <td className="px-4 py-2 whitespace-nowrap dark:text-white">
                                                {detail.length}
                                              </td>
                                              <td className="px-4 py-2 whitespace-nowrap dark:text-white">
                                                {detail.material}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-gray-500 dark:text-gray-400">
                                    No pipeline details available
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                              Created:{" "}
                              {new Date(log.createdAt).toLocaleString()} | Last
                              Updated:{" "}
                              {new Date(log.updatedAt).toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-indigo-100 dark:from-brand-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-brand-500 dark:text-brand-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No build logs found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              {["admin", "supervisor", "foreman"].includes(user?.role || "")
                ? "Start by adding your first build log using the button above."
                : "There are no build logs available for this project yet."}
            </p>
            {["admin", "supervisor", "foreman"].includes(user?.role || "") && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Create Your First Log
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
