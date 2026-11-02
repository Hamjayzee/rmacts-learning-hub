import { useEffect, useState, type FormEvent } from "react";

import Dashboard from "./Dashboard";
import StudentProfile, { loadProfileData } from "./StudentProfile";
import { supabase, getRole, type AppUser } from "./cloud";
import logoUrl from "./assets/rmacts-logo.png.asset.json";
import "./style.css";

type View = "login" | "reset" | "newpass" | "profile" | "dashboard";

export default function App() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState("student");
  const [view, setView] = useState<View>("login");

  async function enter(u: { id: string; email?: string | null }) {
    const appUser = { uid: u.id, email: u.email ?? null };
    const r = await getRole(u.id);
    setUser(appUser);
    setRole(r);
    if (r === "student") {
      const p = await loadProfileData(u.id);
      if (!p || !p.surname) {
        setView("profile");
        setMessage("Please complete your profile to continue.");
        return;
      }
    }
    setView("dashboard");
    setMessage("Welcome to RMACTS Learning Hub!");
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(event => {
      if (event === "PASSWORD_RECOVERY") setView("newpass");
    });
    if (window.location.hash.includes("type=recovery")) {
      setView("newpass");
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) enter(data.session.user);
      });
    }
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("Please wait...");
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Account created! Check your email and click the confirmation link, then log in.");
          setMode("login");
          return;
        }
        await enter(data.session.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await enter(data.user);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setMessage("Please wait...");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error && /valid/i.test(error.message)) setMessage("Please enter a valid email address.");
    else if (error && /rate|seconds/i.test(error.message)) setMessage("Too many attempts. Please wait a few minutes and try again.");
    else setMessage("If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.");
  }

  async function handleNewPassword(e: FormEvent) {
    e.preventDefault();
    setMessage("Please wait...");
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) { setMessage(error.message); return; }
    window.history.replaceState(null, "", window.location.pathname);
    setPassword("");
    await enter(data.user);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setView("login");
    setMessage("");
    setMode("login");
  }

  if (user && view === "profile") {
    return (
      <StudentProfile
        user={user}
        onSaveed={() => {
          setView("dashboard");
          setMessage("Welcome to RMACTS Learning Hub!");
        }}
      />
    );
  }

  if (user && view === "dashboard") {
    return <Dashboard user={user} role={role} onLogout={handleLogout} />;
  }

  const header = (
    <>
      <img src={logoUrl.url} alt="RMACTS logo" className="brand-logo" />
      <h1>RMACTS Learning Hub</h1>
      <p>Your learning resources, all in one place.</p>
    </>
  );

  if (view === "newpass") {
    return (
      <main className="container">
        {header}
        <form className="panel" onSubmit={handleNewPassword}>
          <h2>Choose a New Password</h2>
          <label>New Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" />
          <button type="submit">Save New Password</button>
          <p>{message}</p>
        </form>
      </main>
    );
  }

  if (view === "reset") {
    return (
      <main className="container">
        {header}
        <form className="panel" onSubmit={handleReset}>
          <h2>Reset Password</h2>
          <p>Enter your account email and we'll send you a link to choose a new password.</p>
          <label>Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" />
          <button type="submit">Send Reset Link</button>
          <p>{message}</p>
          <button type="button" className="secondary" onClick={() => { setView("login"); setMessage(""); }}>
            Back to Login
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="container">
      {header}
      <form className="panel" onSubmit={handleSubmit}>
        <h2>{mode === "login" ? "Welcome Back" : "Create Student Account"}</h2>

        <label>Email Address</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" />

        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" />

        <button type="submit">{mode === "login" ? "Log In" : "Register as Student"}</button>

        <p>{message}</p>

        {mode === "login" && (
          <button type="button" className="secondary" onClick={() => { setView("reset"); setMessage(""); }}>
            Forgot Password?
          </button>
        )}

        <button type="button" className="secondary" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>
          {mode === "login" ? "Create Student Account" : "Back to Login"}
        </button>
      </form>
    </main>
  );
}
