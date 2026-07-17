import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerProfile from "./pages/CustomerProfile";

// Basic placeholder auth guard — replace with real Firebase auth state
function useIsAuthed() {
  return true; // set to actual auth check once Firebase login is wired up
}

function AppLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar onLogout={() => {}} />
      <main className="flex-1 min-h-screen overflow-y-auto p-8">{children}</main>
    </div>
  );
}

export default function App() {
  const isAuthed = useIsAuthed();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={isAuthed ? (
            <AppLayout><Dashboard /></AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )}
        />
        <Route
          path="/customers"
          element={isAuthed ? (
            <AppLayout><Customers /></AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )}
        />
        <Route
          path="/customers/:id"
          element={isAuthed ? (
            <AppLayout><CustomerProfile /></AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}
