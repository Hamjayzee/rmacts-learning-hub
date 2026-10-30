
import { useState, type FormEvent } from "react";
import type { User } from "firebase/auth";

import Dashboard from "./Dashboard";
import StudentProfile, { loadProfileData } from "./StudentProfile";
import logoUrl from "./assets/rmacts-logo.png.asset.json";
import "./style.css";

async function getFirebase() {
  const { auth, db } = await import("./firebase");
  const { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } = await import("firebase/auth");
  const { doc, getDoc, setDoc } = await import("firebase/firestore");
  return { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, doc, getDoc, setDoc };
}

type View = "login" | "reset" | "profile" | "dashboard";

export default function App() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("student");
  const [view, setView] = useState<View>("login");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("Please wait...");

    try {
      const fb = await getFirebase();
      let result;

      if (mode === "register") {
        result = await fb.createUserWithEmailAndPassword(
          fb.auth,
          email,
          password
        );

        await fb.setDoc(fb.doc(fb.db, "users", result.user.uid), {
          email: result.user.email,
          role: "student"
        });
      } else {
        result = await fb.signInWithEmailAndPassword(
          fb.auth,
          email,
          password
        );
      }

      const profile = await fb.getDoc(
        fb.doc(fb.db, "users", result.user.uid)
      );

      if (!profile.exists()) {
        await fb.signOut(fb.auth);
        setMessage("Account profile not found. Contact the administrator.");
        return;
      }

      setUser(result.user);
      setRole(profile.data()?.["role"] || "student");

      const studentRole = profile.data()?.["role"] || "student";
      if (studentRole === "student") {
        const profileData = await loadProfileData(result.user.uid);
        if (!profileData || !profileData.surname) {
          setView("profile");
          setMessage("Please complete your profile to continue.");
          return;
        }
      }

      setView("dashboard");
      setMessage("Welcome to RMACTS Learning Hub!");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setMessage("Please wait...");
    try {
      const fb = await getFirebase();
      await fb.sendPasswordResetEmail(fb.auth, email);
      setMessage(
        "If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder."
      );
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "auth/user-not-found") {
        setMessage(
          "If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder."
        );
      } else if (code === "auth/invalid-email") {
        setMessage("Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        setMessage("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setMessage(error instanceof Error ? error.message : String(error));
      }
    }
  }

  async function handleLogout() {
    const fb = await getFirebase();
    await fb.signOut(fb.auth);
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
    return (
      <Dashboard
        user={user}
        role={role}
        onLogout={handleLogout}
      />
    );
  }

  if (view === "reset") {
    return (
      <main className="container">
        <img src={logoUrl.url} alt="RMACTS logo" className="brand-logo" />
        <h1>RMACTS Learning Hub</h1>
        <p>Your learning resources, all in one place.</p>

        <form className="panel" onSubmit={handleReset}>
          <h2>Reset Password</h2>
          <p>Enter your account email and we'll send you a link to choose a new password.</p>

          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />

          <button type="submit">Send Reset Link</button>

          <p>{message}</p>

          <button
            type="button"
            className="secondary"
            onClick={() => {
              setView("login");
              setMessage("");
            }}
          >
            Back to Login
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="container">
      <img src={logoUrl.url} alt="RMACTS logo" className="brand-logo" />
      <h1>RMACTS Learning Hub</h1>
      <p>Your learning resources, all in one place.</p>

      <form className="panel" onSubmit={handleSubmit}>
        <h2>{mode === "login" ? "Welcome Back" : "Create Student Account"}</h2>

        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="At least 6 characters"
        />

        <button type="submit">
          {mode === "login" ? "Log In" : "Register as Student"}
        </button>

        <p>{message}</p>

        {mode === "login" && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setView("reset");
              setMessage("");
            }}
          >
            Forgot Password?
          </button>
        )}

        <button
          type="button"
          className="secondary"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setMessage("");
          }}
        >
          {mode === "login"
            ? "Create Student Account"
            : "Back to Login"}
        </button>
      </form>
    </main>
  );
}
