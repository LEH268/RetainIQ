import { useState } from "react";  
import { Link, useNavigate } from "react-router-dom";  
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";  
import { auth } from "../lib/firebase";  

export default function Login() {      
  const [email, setEmail] = useState("john@company.com");      
  const [password, setPassword] = useState(""); 
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");      
  const [loading, setLoading] = useState(false);      
  const navigate = useNavigate();      

  async function handleSubmit(e) {          
    e.preventDefault();          
    setError(""); setLoading(true);          
    try {              
      await signInWithEmailAndPassword(auth, email, password);              
      navigate("/");          
    } catch (err) {              
      setError("Incorrect Email or Password");          
    } finally {              
      setLoading(false);          
    }      
  }

  return (          
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4">              
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-8 shadow-sm">                  
        <div className="flex justify-center mb-6">
          <div className="bg-[var(--color-brand)] text-white px-4 py-2 rounded-lg font-display font-bold text-2xl shadow-lg">RetainIQ</div>
        </div>
        <p className="mt-1 text-sm text-ink/60 font-medium text-center">Smart Customer Retention</p>                  
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">                      
          <div>                          
            <label className="mb-1 block text-sm font-bold">Email</label>                          
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border-2 border-[var(--color-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]" placeholder="john@company.com" />                      
          </div>                      
          <div className="relative">                          
            <label className="mb-1 block text-sm font-bold">Password</label>                          
            <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border-2 border-[var(--color-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]" placeholder="••••••••" />                      
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-9 text-ink/50 text-sm font-bold hover:text-ink">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" className="rounded border-gray-300 text-[var(--color-brand)] focus:ring-[var(--color-brand)]" />
            <label htmlFor="remember" className="text-sm font-medium text-ink/70">Remember Me</label>
          </div>
          {error && <p className="text-sm font-bold text-[var(--color-risk-high)] bg-red-50 p-2 rounded-lg text-center" role="alert">{error}</p>}                      
          <button type="submit" disabled={loading} className="mt-2 rounded-xl bg-[var(--color-brand)] py-3 text-sm font-bold text-white hover:bg-[var(--color-brand-dark)] transition-colors">                          
            {loading ? "Logging in..." : "Login"}                      
          </button>                  
        </form>                  
        <div className="flex justify-between items-center mt-6 text-sm font-medium text-ink/60">
          <button type="button" className="font-bold text-[var(--color-brand)] hover:underline">Forgot Password?</button>
        </div>
        <p className="mt-6 text-center text-sm font-medium text-ink/60 pt-6 border-t border-[var(--color-border)]">                      
          Don't have an account? <br/><Link to="/register" className="font-bold text-[var(--color-brand)] hover:underline mt-1 block">Create Account (Admin Only)</Link>                  
        </p>              
      </div>          
    </div>      
  );  
}