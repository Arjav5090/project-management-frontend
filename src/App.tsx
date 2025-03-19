import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import PrivateRoute from "./pages/AuthPages/PrivateRoute";
import RoleBasedRedirect from "./pages/AuthPages/RoleBasedRedirect";
import AdminUserManagement from "./pages/Admin/AdminUserManagement";
import { AuthProvider } from "./pages/AuthPages/AuthContext";
import AdminProjects from "./pages/Admin/AdminProjects";
import Projects from "./pages/Dashboard/Project";
import AdminZones from "./pages/Admin/AdminZones";
import { api } from "./api/api"; // ✅ Ensure correct import path
import AdminAssignments from "./pages/Admin/AdminAssignments";
import BuildLogs from "./pages/Dashboard/Buildlogs";


export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* ✅ Default Route: Redirect to Sign-In */}
          <Route path="/" element={<Navigate to="/signin" />} />

          {/* Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/home" element={<Projects />} />{" "}
              {/* Admin will be redirected here */}
              <Route path="/redirect" element={<RoleBasedRedirect />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/admin/users" element={<AdminUserManagement />} />
              <Route path="/admin/projects" element={<AdminProjects />} />
              <Route path="/admin/assignments" element={<AdminAssignments />} />
              <Route path="/build-logs/project/:projectId" element={<BuildLogs/>} />
              <Route
                path="/admin/projects/:projectId/zones"
                element={<AdminZones />}
              />
              <Route path="/build-logs/zone/:zoneId" element={<BuildLogs />} />
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/blank" element={<Blank />} />
              <Route path="/form-elements" element={<FormElements />} />
              <Route path="/basic-tables" element={<BasicTables />} />
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
