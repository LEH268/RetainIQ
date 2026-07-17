import { useEffect, useState } from "react"; 
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; 
import { onAuthStateChanged, signOut } from "firebase/auth"; 
import { auth } from "./lib/firebase"; 
import Sidebar from "./components/Sidebar"; 
import Login from "./pages/Login"; 
import Register from "./pages/Register"; 
import Dashboard from "./pages/Dashboard"; 
import Customers from "./pages/Customers"; 
import CustomerProfile from "./pages/CustomerProfile"; 
import Reports from "./pages/Reports";
import Campaigns from "./pages/Campaigns";
import Settings from "./pages/Settings";

function useAuth() {   
  const [state, setState] = useState({ user: null, loading: true });   
  useEffect(() => {     
    const unsubscribe = onAuthStateChanged(auth, (user) => {       
      setState({ user, loading: false });     
    });     
    return unsubscribe;   
  }, []);   
  return state; 
}

function AppLayout({ children, onLogout }) {   
  return (     
    <div className="flex bg-[var(--color-canvas)] h-screen overflow-hidden">       
      <Sidebar onLogout={onLogout} />       
      <main className="flex-1 overflow-y-auto p-10">{children}</main>     
    </div>   
  ); 
}

function FullScreenMessage({ children }) {   
  return (     
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] text-sm font-medium text-ink/60">       
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin"></div>
        {children}
      </div>
    </div>   
  ); 
}

export default function App() {   
  const { user, loading } = useAuth();   
  async function handleLogout() {     
    try {       
      await signOut(auth);     
    } catch (err) {       
      console.error("Failed to sign out:", err);     
    }   
  }

  if (loading) {     
    return <FullScreenMessage>Loading RetainIQ...</FullScreenMessage>;   
  }

  return (     
    <BrowserRouter>       
      <Routes>         
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />         
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />         
        <Route path="/" element={user ? <AppLayout onLogout={handleLogout}><Dashboard /></AppLayout> : <Navigate to="/login" replace />} />         
        <Route path="/customers" element={user ? <AppLayout onLogout={handleLogout}><Customers /></AppLayout> : <Navigate to="/login" replace />} />         
        <Route path="/customers/:id" element={user ? <AppLayout onLogout={handleLogout}><CustomerProfile /></AppLayout> : <Navigate to="/login" replace />} />         
        <Route path="/reports" element={user ? <AppLayout onLogout={handleLogout}><Reports /></AppLayout> : <Navigate to="/login" replace />} />         
        <Route path="/campaigns" element={user ? <AppLayout onLogout={handleLogout}><Campaigns /></AppLayout> : <Navigate to="/login" replace />} />         
        <Route path="/settings" element={user ? <AppLayout onLogout={handleLogout}><Settings /></AppLayout> : <Navigate to="/login" replace />} />         
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />       
      </Routes>     
    </BrowserRouter>   
  ); 
}