import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import logo from "../assets/RetainIQ Logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); 
    setLoading(true);
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--color-canvas)] to-[var(--color-brand-soft)] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-white p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[var(--color-brand-soft)]/60 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center mb-8">
          <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 mb-5">
            <img src={logo} alt="RetainIQ Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-ink/60 font-medium text-center">Smart Customer Retention</p>
        </div>
        
        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-ink/80">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-brand)] focus:bg-white transition-all" placeholder="john@company.com" />
          </div>
          <div className="relative">
            <label className="mb-1.5 block text-sm font-bold text-ink/80">Password</label>
            <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-brand)] focus:bg-white transition-all" placeholder="Enter your password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-10 text-ink/50 text-sm font-bold hover:text-[var(--color-brand)] transition-colors">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" className="h-4 w-4 rounded border-gray-300 text-[var(--color-brand)] focus:ring-[var(--color-brand)] cursor-pointer" />
            <label htmlFor="remember" className="text-sm font-medium text-ink/70 cursor-pointer">Remember Me</label>
          </div>
          
          {error && <p className="text-sm font-bold text-[var(--color-risk-high)] bg-rose-50 border border-rose-100 p-3 rounded-xl text-center shadow-sm" role="alert">{error}</p>}
          
          <button type="submit" disabled={loading} className="mt-2 rounded-xl bg-[var(--color-brand)] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[var(--color-brand-dark)] hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <div className="relative z-10 flex justify-center items-center mt-6 text-sm font-medium text-ink/60">
          <button type="button" className="font-bold text-[var(--color-brand)] hover:text-[var(--color-brand-dark)] hover:underline transition-colors">Forgot Password?</button>
        </div>
        
        <p className="relative z-10 mt-8 text-center text-sm font-medium text-ink/60 pt-6 border-t border-[var(--color-border)]">
          Don't have an account? <br/>
          <Link to="/register" className="inline-block mt-2 font-bold text-[var(--color-brand)] hover:text-[var(--color-brand-dark)] hover:underline transition-colors">Create Account (Admin Only)</Link>
        </p>
      </div>
    </div>
  );
}