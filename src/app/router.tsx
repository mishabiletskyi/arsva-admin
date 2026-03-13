import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { OrganizationsPage } from "../features/organizations/pages/OrganizationsPage";
import { PropertiesPage } from "../features/properties/pages/PropertiesPage";
import { TenantsPage } from "../features/tenants/pages/TenantsPage";
import { ImportsPage } from "../features/imports/pages/ImportsPage";
import { CallLogsPage } from "../features/call-logs/pages/CallLogsPage";
import { AdminUsersPage } from "../features/admin-users/pages/AdminUsersPage";
import { OutboundCallsPage } from "../features/outbound-calls/pages/OutboundCallsPage";
import { ReportsPage } from "../features/reports/pages/ReportsPage";
import { CallPolicyPage } from "../features/call-policy/pages/CallPolicyPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="imports" element={<ImportsPage />} />
          <Route path="call-logs" element={<CallLogsPage />} />
          <Route path="call-policy" element={<CallPolicyPage />} />
          <Route path="outbound-calls" element={<OutboundCallsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="admin-users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
