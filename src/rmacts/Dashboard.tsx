import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import AdminDashboard, { type Material } from "./AdminDashboard";
import StudentProfile, { loadProfileData, type ProfileData } from "./StudentProfile";
import logoUrl from "./assets/rmacts-logo.png.asset.json";

type Tab = "overview" | "library" | "quizzes" | "manage" | "students" | "profile";

function kindOf(m: Material): { label: string; cls: string } {
  if (m.isQuiz) return { label: "Quiz", cls: "quiz" };
  const n = (m.fileName || m.fileUrl || "").toLowerCase();
  if (n.includes(".pdf")) return { label: "PDF", cls: "pdf" };
  if (n.includes(".ppt")) return { label: "Slides", cls: "ppt" };
  if (n.includes(".doc")) return { label: "Document", cls: "doc" };
  if (n.includes(".xls")) return { label: "Spreadsheet", cls: "xls" };
  return { label: "Resource", cls: "link" };
}

export function MaterialCard({ item }: { item: Material }) {
  const k = kindOf(item);
  return (
    <article className="m-card">
      <span className={`m-badge ${k.cls}`}>{k.label}</span>
      <h4>{item.title || "Untitled material"}</h4>
      {item.description && <p>{item.description}</p>}
      <div className="m-actions">
        {item.fileUrl && (
          <a className="m-btn" href={item.fileUrl} target="_blank" rel="noreferrer">Open file</a>
        )}
        {item.link && (
          <a className="m-btn" href={item.link} target="_blank" rel="noreferrer">
            {item.isQuiz ? "Start quiz" : "Open resource"}
          </a>
        )}
      </div>
    </article>
  );
}

export default function Dashboard({ user, role, onLogout }: { user: User; role: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const isAdmin = role === "admin";

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "materials"));
      setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setError("");
    } catch {
      setError("Could not load materials. Check Firestore rules.");
    } finally {
      setLoading(false);
    }
  }

  async function loadUserProfile() {
    const p = await loadProfileData(user.uid);
    setProfile(p);
  }

  useEffect(() => {
    load();
    loadUserProfile();
  }, []);

  const resources = materials.filter(m => !m.isQuiz);
  const quizzes = materials.filter(m => m.isQuiz);
  const filtered = useMemo(() => {
    const list = tab === "quizzes" ? quizzes : resources;
    const q = query.trim().toLowerCase();
    return q ? list.filter(m => `${m.title} ${m.description}`.toLowerCase().includes(q)) : list;
  }, [materials, tab, query]);

  const displayName = profile?.surname
    ? `${profile.surname} ${profile.otherNames}`.trim()
    : (user.email || "").split("@")[0] ?? "";
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "library", label: "Library" },
    { id: "quizzes", label: "Quizzes" },
    { id: "profile", label: "My Profile" },
    ...(isAdmin ? [{ id: "manage" as Tab, label: "Manage Content" }, { id: "students" as Tab, label: "Students" }] : []),
  ];

  return (
    <div className="dash">
      <header className="dash-top">
        <div className="dash-brand">
          <img src={logoUrl.url} alt="RMACTS logo" />
          <span>RMACTS Learning Hub</span>
        </div>
        <div className="dash-user">
          {profile?.photoUrl ? (
            <img src={profile.photoUrl} alt="" className="avatar-img" />
          ) : (
            <span className="avatar">{displayName.charAt(0).toUpperCase()}</span>
          )}
          <span className="dash-username">{displayName}</span>
          <button className="ghost" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <nav className="dash-tabs">
        {tabs.map(t => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => { setTab(t.id); setQuery(""); }}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="dash-body">
        {tab === "overview" && (
          <>
            <section className="hero-card">
              <p className="eyebrow">{isAdmin ? "Administrator" : "Student"}</p>
              <h2>Welcome back, {displayName}</h2>
              <p>Continue learning with the latest notes, slides and quizzes from RMACTS.</p>
              <button onClick={() => setTab("library")}>Browse library</button>
            </section>
            <section className="stats">
              <div className="stat"><strong>{resources.length}</strong><span>Learning resources</span></div>
              <div className="stat"><strong>{quizzes.length}</strong><span>Quizzes</span></div>
              <div className="stat"><strong>{materials.length}</strong><span>Total items</span></div>
            </section>
            <section className="dash-section">
              <div className="section-head">
                <h3>Recently added</h3>
                <button className="link-btn" onClick={() => setTab("library")}>View all</button>
              </div>
              {loading ? <p className="muted">Loading…</p> : materials.length === 0
                ? <p className="muted">No materials yet.</p>
                : <div className="m-grid">{materials.slice(-4).reverse().map(m => <MaterialCard key={m.id} item={m} />)}</div>}
            </section>
          </>
        )}

        {(tab === "library" || tab === "quizzes") && (
          <section className="dash-section">
            <div className="section-head">
              <h3>{tab === "library" ? "Learning Library" : "Quizzes & Assessments"}</h3>
              <button className="link-btn" onClick={load}>Refresh</button>
            </div>
            <input className="search" placeholder="Search by title or topic…" value={query} onChange={e => setQuery(e.target.value)} />
            {loading ? <p className="muted">Loading…</p> : filtered.length === 0
              ? <p className="muted">Nothing here yet.</p>
              : <div className="m-grid">{filtered.map(m => <MaterialCard key={m.id} item={m} />)}</div>}
          </section>
        )}

        {tab === "profile" && (
          <section className="dash-section">
            <div className="section-head">
              <h3>My Profile</h3>
            </div>
            <StudentProfile user={user} onSaveed={loadUserProfile} />
          </section>
        )}

        {isAdmin && (tab === "manage" || tab === "students") && (
          <AdminDashboard view={tab} onChange={load} />
        )}

        {error && <p className="error">{error}</p>}
      </main>
    </div>
  );
}
