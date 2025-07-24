import { Routes, Route, Navigate } from "react-router-dom";
import AdminPage from "../pages/AdminPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminEquipmentTypesPage from "../pages/AdminEquipmentTypesPage";
// інші адмін-сторінки пізніше

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminPage />}>
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="equipment-types" element={<AdminEquipmentTypesPage />} />
        {/* Додаси тут інші сторінки */}
      </Route>
    </Routes>
  );
}
