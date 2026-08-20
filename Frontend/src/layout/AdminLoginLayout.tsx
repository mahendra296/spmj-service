import { Outlet } from "react-router-dom";

export default function AdminLoginLayout() {
  return (
    <main className="auth-shell">
      <Outlet />
    </main>
  );
}
