/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

interface User {
  _id: string; // ✅ Ensure `_id` exists
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        

        if (!decoded.sub) {
          throw new Error("Token missing user ID");
        }

        setUser({ _id: decoded.sub, email: decoded.email, role: decoded.role });
      } catch (error) {
        console.error("Invalid token", error);
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }
    }
  }, [token]); // ✅ Only run when `token` changes

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    window.location.href = "/signin"; // Redirect to login
  };

  return (
    <AuthContext.Provider value={{ user, token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
