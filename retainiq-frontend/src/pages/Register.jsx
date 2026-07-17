import { useState } from "react"; 
import { Link, useNavigate } from "react-router-dom"; 
import { createUserWithEmailAndPassword } from "firebase/auth"; 
import { auth } from "../lib/firebase"; 

function registerErrorMessage(err) {   
  switch (err?.code) {     
    case "auth/email-already-in-use":       
      return "An account with this email already exists.";     
    case "auth/invalid-email":       
      return "That email address doesn't look right.";     
    case "auth/weak-password":       
      return "Password should be at least 6 characters.";     
    default:       
      return "Couldn't create your account. Please try again.";   
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4">       
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-8 shadow-sm">         
        <h1 className="font-display text-2xl font-semibold">Create your account</h1>         
        <p className="mt-1 text-sm text-ink/60">Get started monitoring customer health and churn risk.</p>         
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">           
          <div>             
            <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>             
            <input               
              id="email"               
              type="email"               
              required               
              autoComplete="email"               
              value={email}               
              onChange={(e) => setEmail(e.target.value)}               
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand)]"               
              placeholder="you@company.com"             
            />           
          </div>           
          <div>             
            <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>             
            <input               
              id="password"               
              type="password"               
              required               
              minLength={6}               
              autoComplete="new-password"               
              value={password}               
              onChange={(e) => setPassword(e.target.value)}               
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand)]"               
              placeholder="At least 6 characters"             
            />           
          </div>           
          <div>             
            <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium">Confirm password</label>             
            <input               
              id="confirm-password"               
              type="password"               
              required               
              autoComplete="new-password"               
              value={confirmPassword}               
              onChange={(e) => setConfirmPassword(e.target.value)}               
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand)]"               
              placeholder="••••••••"             
            />           
          </div>           
          {error && <p className="text-sm text-[var(--color-risk-high)]" role="alert">{error}</p>}           
          <button             
            type="submit"             
            disabled={loading}             
            className="mt-2 rounded-lg bg-[var(--color-brand)] py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"           
          >             
            {loading ? "Creating account..." : "Create account"}           
          </button>         
        </form>         
        <p className="mt-4 text-center text-sm text-ink/60">           
          Already have an account? <Link to="/login" className="text-[var(--color-brand)] hover:underline">Sign in</Link>         
        </p>       
      </div>     
    </div>   
  ); 
}