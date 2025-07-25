import { Routes, Route, Navigate } from "react-router-dom";
import AdminPage from "../pages/AdminPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminEquipmentTypesPage from "../pages/AdminEquipmentTypesPage";
import AdminEquipmentUnitsPage from "../pages/AdminEquipmentUnitsPage";
import AdminLocationsPage from "../pages/AdminLocationsPage";
import AdminProceduresPage from "../pages/AdminProceduresPage";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminPage />}>
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="equipment-types" element={<AdminEquipmentTypesPage />} />
        <Route path="equipment-units" element={<AdminEquipmentUnitsPage />} />
        <Route path="locations" element={<AdminLocationsPage />} />
        <Route path="procedures" element={<AdminProceduresPage />} />
      </Route>
    </Routes>
  );
}
