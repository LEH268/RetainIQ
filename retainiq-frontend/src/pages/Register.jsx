import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import logo from "../assets/RetainIQ Logo.png";

function registerErrorMessage(err) {
  switch (err?.code) {
    case "auth/email-already-in-use": return "An account with this email already exists.";
    case "auth/invalid-email": return "That email address doesn't look right.";
    case "auth/weak-password": return "Password should be at least 6 characters.";
    default: return "Couldn't create your account. Please try again.";
  }
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(registerErrorMessage(err));
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
          <h1 className="font-display text-3xl font-bold text-ink text-center">Create account</h1>
          <p className="mt-2 text-sm text-ink/60 font-medium text-center">Get started monitoring customer health.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-ink/80">Email</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-brand)] focus:bg-white transition-all" placeholder="you@company.com" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-ink/80">Password</label>
            <input id="password" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-brand)] focus:bg-white transition-all" placeholder="At least 6 characters" />
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-bold text-ink/80">Confirm password</label>
            <input id="confirm-password" type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-brand)] focus:bg-white transition-all" placeholder="Re-enter password" />
          </div>
          
          {error && <p className="text-sm font-bold text-[var(--color-risk-high)] bg-rose-50 border border-rose-100 p-3 rounded-xl text-center shadow-sm" role="alert">{error}</p>}
          
          <button type="submit" disabled={loading} className="mt-2 rounded-xl bg-[var(--color-brand)] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[var(--color-brand-dark)] hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        
        <p className="relative z-10 mt-8 text-center text-sm font-medium text-ink/60 pt-6 border-t border-[var(--color-border)]">
          Already have an account? <Link to="/login" className="inline-block mt-2 font-bold text-[var(--color-brand)] hover:text-[var(--color-brand-dark)] hover:underline transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}