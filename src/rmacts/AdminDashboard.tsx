import { useEffect, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";

export type Material = {
  id: string;
  title?: string;
  description?: string;
  link?: string;
  fileUrl?: string;
  fileName?: string;
  isQuiz?: boolean;
};
type Student = { id: string; email?: string; role?: string };

const ACCEPTED_FILE_TYPES =
  ".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";

export default function AdminDashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [isQuiz, setIsQuiz] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function loadMaterials() {
    try {
      const snap = await getDocs(collection(db, "materials"));
      setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      setMessage("Could not load materials. Check Firestore rules.");
    }
  }

  async function loadStudents() {
    try {
      const snap = await getDocs(collection(db, "users"));
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      setMessage("Could not load students. Check Firestore rules.");
    }
  }

  useEffect(() => {
    loadMaterials();
    loadStudents();
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setLink("");
    setIsQuiz(false);
    setFile(null);
    setEditingId(null);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("Saving...");

    try {
      const data: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        link: link.trim(),
        isQuiz,
      };

      if (file) {
        setMessage("Uploading file...");
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileRef = ref(storage, `materials/${Date.now()}-${safeName}`);
        await uploadBytes(fileRef, file);
        data["fileUrl"] = await getDownloadURL(fileRef);
        data["fileName"] = file.name;
      }

      if (editingId) {
        await updateDoc(doc(db, "materials", editingId), data);
        setMessage("Material updated.");
      } else {
        await addDoc(collection(db, "materials"), { ...data, createdAt: serverTimestamp() });
        setMessage("Material added.");
      }
      resetForm();
      loadMaterials();
    } catch {
      setMessage(
        "Could not save. If you attached a file, check that Firebase Storage is enabled and its rules allow admins to write."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(item: Material) {
    if (!window.confirm(`Delete "${item.title || "Untitled material"}"?`)) return;
    try {
      await deleteDoc(doc(db, "materials", item.id));
      setMessage("Material deleted.");
      loadMaterials();
    } catch {
      setMessage("Could not delete. Check Firestore rules.");
    }
  }

  return (
    <section className="panel">
      <h2>Admin Dashboard</h2>

      <form onSubmit={handleSave}>
        <h3>{editingId ? "Edit Material" : "Add Material"}</h3>
        <label>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Week 1 Notes" />
        <label>Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" />

        <label>Attach a file (PDF, PowerPoint, Word, Excel)</label>
        <input
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />

        <label>Link (optional)</label>
        <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={isQuiz}
            onChange={e => setIsQuiz(e.target.checked)}
            style={{ width: "auto" }}
          />
          This link is a quiz (e.g. Google Forms)
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "Working..." : editingId ? "Save Changes" : "Add Material"}
        </button>
        {editingId && (
          <button type="button" className="secondary" onClick={resetForm}>Cancel Edit</button>
        )}
      </form>
      <p>{message}</p>

      <h3>All Materials ({materials.length})</h3>
      {materials.map(item => (
        <article key={item.id}>
          <h4>
            {item.title || "Untitled material"}
            {item.isQuiz ? " (Quiz)" : ""}
          </h4>
          <p>{item.description || ""}</p>
          {item.fileUrl && (
            <p>
              <a href={item.fileUrl} target="_blank" rel="noreferrer">
                Open file{item.fileName ? `: ${item.fileName}` : ""}
              </a>
            </p>
          )}
          {item.link && (
            <p><a href={item.link} target="_blank" rel="noreferrer">{item.isQuiz ? "Open quiz" : "Open link"}</a></p>
          )}
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setEditingId(item.id);
              setTitle(item.title || "");
              setDescription(item.description || "");
              setLink(item.link || "");
              setIsQuiz(!!item.isQuiz);
              setFile(null);
              setMessage("");
            }}
          >
            Edit
          </button>
          <button type="button" className="secondary" onClick={() => handleDelete(item)}>Delete</button>
        </article>
      ))}

      <h3>Students ({students.filter(s => s.role !== "admin").length})</h3>
      <ul>
        {students.filter(s => s.role !== "admin").map(s => (
          <li key={s.id}>{s.email || s.id}</li>
        ))}
      </ul>
    </section>
  );
}
