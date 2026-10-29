
import { useState, type FormEvent } from "react";
import type { User } from "firebase/auth";

type Material = { id: string; title?: string; description?: string };
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs
} from "firebase/firestore";
import { auth, db } from "./firebase";
import "./style.css";

export default function App() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("student");
  const [materials, setMaterials] = useState<Material[]>([]);

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
      setMessage("Welcome to RMACTS Learning Box!");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function loadMaterials() {
    try {
      const snapshot = await getDocs(collection(db, "materials"));
      setMaterials(
        snapshot.docs.map(item => ({
          id: item.id,
          ...item.data()
        }))
      );
    } catch (error) {
      setMessage("Could not load materials. Check Firestore rules.");
    }
  }

  if (user) {
    return (
      <main className="container">
        <h1>RMACTS Learning Box</h1>
        <p>Welcome, {user.email}</p>
        <p>Account type: {role}</p>

        {role === "admin" && (
          <section className="panel">
            <h2>Admin Dashboard</h2>
            <p>You are signed in as an administrator.</p>
            <p>Material upload will be added after storage is arranged.</p>
          </section>
        )}

        <section className="panel">
          <h2>Learning Materials</h2>
          <button onClick={loadMaterials}>Load Materials</button>
          {materials.map(item => (
            <article key={item.id}>
              <h3>{item.title || "Untitled material"}</h3>
              <p>{item.description || ""}</p>
            </article>
          ))}
        </section>

        <button onClick={async () => {
          await signOut(auth);
          setUser(null);
          setMessage("");
        }}>
          Log out
        </button>
        <p>{message}</p>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="brand">R</div>
      <h1>RMACTS Learning Box</h1>
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
