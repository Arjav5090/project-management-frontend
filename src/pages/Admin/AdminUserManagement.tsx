/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router";
import { useAuth } from "../AuthPages/AuthContext";

type User = {
  _id: string;
  email: string;
  role: string;
};

function AdminUserManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/"); // ✅ Non-admins are redirected
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:3000/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      fetchUsers();
      setNewUser({ email: "", password: "", role: "user" });
    } catch (error) {
      setError("Failed to create user.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await fetch(`http://localhost:3000/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchUsers();
    } catch (error) {
      setError("Failed to delete user.");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "error";
      case "supervisor":
        return "warning";
      case "foreman":
        return "success";
      default:
        return "success";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">User Management</h1>

      {error && <p className="text-red-500 dark:text-red-400 mt-2">{error}</p>}

      <form onSubmit={handleCreateUser} className="mt-4">
        <input
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          required
          className="p-2 border rounded mr-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-200 dark:border-gray-700"
        />
        <input
          type="password"
          placeholder="Password"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          required
          className="p-2 border rounded mr-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-200 dark:border-gray-700"
        />
        <select
          value={newUser.role}
          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          className="py-2 px-4 border rounded mr-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-200 dark:border-gray-700"
        >
          <option value="user">User</option>
          <option value="foreman">Foreman</option>
          <option value="supervisor">Supervisor</option>
        </select>
        <button
          type="submit"
          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
        >
          Create User
        </button>
      </form>

      <h2 className="mt-6 text-lg font-semibold text-gray-800 dark:text-white">
        All Users
      </h2>

      <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full">
              {/* Table Header */}
              <thead className="border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    User
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Role
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((user: User) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="font-medium text-gray-600 dark:text-gray-200">
                              {user.email.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${
                            getRoleBadgeColor(user.role) === "success"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : getRoleBadgeColor(user.role) === "warning"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUserManagement;
