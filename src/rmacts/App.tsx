
import { useState, type FormEvent } from "react";
import type { User } from "firebase/auth";

import Dashboard from "./Dashboard";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { auth, db } from "./firebase";
import logoUrl from "./assets/rmacts-logo.png.asset.json";
import "./style.css";

export default function App() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("student");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("Please wait...");

    try {
      let result;

      if (mode === "register") {
        result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await setDoc(doc(db, "users", result.user.uid), {
          email: result.user.email,
          role: "student"
        });
      } else {
        result = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      const profile = await getDoc(
        doc(db, "users", result.user.uid)
      );

      if (!profile.exists()) {
        await signOut(auth);
        setMessage("Account profile not found. Contact the administrator.");
        return;
      }

      setUser(result.user);
      setRole(profile.data()?.["role"] || "student");
      setMessage("Welcome to RMACTS Learning Hub!");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  if (user) {
    return (
      <Dashboard
        user={user}
        role={role}
        onLogout={async () => {
          await signOut(auth);
          setUser(null);
          setMessage("");
        }}
      />
    );
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setMessage("Please wait...");
    try {
      await sendPasswordResetEmail(auth, email);
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

  if (mode === "reset") {
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
              setMode("login");
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
              setMode("reset");
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
