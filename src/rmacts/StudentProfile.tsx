import { useState, type FormEvent } from "react";
import { supabase, signedUrl, type AppUser } from "./cloud";
import logoUrl from "./assets/rmacts-logo.png.asset.json";

type ProfileData = {
  surname: string;
  otherNames: string;
  serviceNumber: string;
  rate: string;
  photoUrl: string;
};

const EMPTY_PROFILE: ProfileData = {
  surname: "",
  otherNames: "",
  serviceNumber: "",
  rate: "",
  photoUrl: "",
};

const MAX_PHOTO_BYTES = 1024 * 1024;


async function compressImage(file: File, maxBytes: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const maxDim = 400;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Cannot process image")); return; }
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.85;
      let blob: Blob | null = null;
      while (quality >= 0.3) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const byteString = atob(dataUrl.split(",")[1] || "");
        const arr = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) arr[i] = byteString.charCodeAt(i);
        blob = new Blob([arr], { type: "image/jpeg" });
        if (blob.size <= maxBytes) break;
        quality -= 0.1;
      }
      if (blob && blob.size <= maxBytes) resolve(blob);
      else reject(new Error("Unable to compress photo below 1MB. Please use a smaller image."));
    };
    img.onerror = () => reject(new Error("Could not load the selected image."));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

export default function StudentProfile({
  user,
  onSaveed,
}: {
  user: AppUser;
  onSaveed: () => void;
}) {
  const [data, setData] = useState<ProfileData>(EMPTY_PROFILE);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadProfile() {
    setLoading(true);
    try {
      const d = await loadProfileData(user.uid);
      if (d) {
        setData(d);
        setPhotoPreview(await signedUrl("profile-photos", d.photoUrl));
      }
    } catch {
      setMessage("Could not load your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file (JPG, PNG, etc.).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setMessage("Photo is larger than 1MB. It will be automatically compressed on save.");
    } else {
      setMessage("");
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("Saving your profile...");

    try {
      let photoUrl = data.photoUrl;

      if (photoFile) {
        setMessage("Processing photo...");
        const compressed = await compressImage(photoFile, MAX_PHOTO_BYTES);
        setMessage("Uploading photo...");
        const path = `${user.uid}/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, compressed, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        photoUrl = path;
      }

      const profileData: ProfileData = {
        surname: data.surname.trim(),
        otherNames: data.otherNames.trim(),
        serviceNumber: data.serviceNumber.trim(),
        rate: data.rate.trim(),
        photoUrl,
      };

      const { error } = await supabase.from("profiles").upsert({
        id: user.uid,
        email: user.email,
        surname: profileData.surname,
        other_names: profileData.otherNames,
        service_number: profileData.serviceNumber,
        rate: profileData.rate,
        photo_url: profileData.photoUrl,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      setData(profileData);
      setMessage("Profile saved successfully!");
      onSaveed();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="container">
        <img src={logoUrl.url} alt="RMACTS logo" className="brand-logo" />
        <h1>RMACTS Learning Hub</h1>
        <p className="panel">Loading your profile...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <img src={logoUrl.url} alt="RMACTS logo" className="brand-logo" />
      <h1>RMACTS Learning Hub</h1>
      <p>Complete your student profile to continue.</p>

      <form className="panel profile-panel" onSubmit={handleSubmit}>
        <h2>Student Profile</h2>

        <div className="photo-section">
          <div className="photo-preview">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" />
            ) : (
              <span className="photo-placeholder">No photo</span>
            )}
          </div>
          <div className="photo-upload">
            <label>Passport Photograph</label>
            <p className="muted">JPG or PNG, max 1MB. Large images are auto-compressed.</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        <label>Surname</label>
        <input
          type="text"
          value={data.surname}
          onChange={e => setData({ ...data, surname: e.target.value })}
          required
          placeholder="e.g. Mensah"
        />

        <label>Other Names</label>
        <input
          type="text"
          value={data.otherNames}
          onChange={e => setData({ ...data, otherNames: e.target.value })}
          required
          placeholder="e.g. Kwame Boateng"
        />

        <label>Service Number</label>
        <input
          type="text"
          value={data.serviceNumber}
          onChange={e => setData({ ...data, serviceNumber: e.target.value })}
          required
          placeholder="e.g. SN-2024-0123"
        />

        <label>Rate / Rank</label>
        <input
          type="text"
          value={data.rate}
          onChange={e => setData({ ...data, rate: e.target.value })}
          required
          placeholder="e.g. Ordinary Seaman"
        />

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>

        {message && <p className={message.includes("success") ? "" : "error-msg"}>{message}</p>}
      </form>
    </main>
  );
}

export { loadProfileData, type ProfileData };

async function loadProfileData(uid: string): Promise<ProfileData | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (!data) return null;
  return {
    surname: data.surname,
    otherNames: data.other_names,
    serviceNumber: data.service_number,
    rate: data.rate,
    photoUrl: data.photo_url,
  };
}
