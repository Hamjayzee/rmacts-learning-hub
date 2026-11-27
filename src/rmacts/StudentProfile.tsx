import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { supabase, signedUrl, type AppUser } from "./cloud";
import logoUrl from "./assets/rmacts-logo.png.asset.json";

type ProfileData = {
  surname: string;
  otherNames: string;
  serviceNumber: string;
  rate: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  address: string;
  about: string;
  hobbies: string;
  photoUrl: string;
  bioCompleted: boolean;
};

const EMPTY_PROFILE: ProfileData = {
  surname: "",
  otherNames: "",
  serviceNumber: "",
  rate: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  address: "",
  about: "",
  hobbies: "",
  photoUrl: "",
  bioCompleted: false,
};

const MAX_PHOTO_BYTES = 1024 * 1024;

export const BIO_STEPS = [
  { id: "bio", label: "Bio Data" },
  { id: "personal", label: "Personal Info" },
  { id: "hobbies", label: "Hobbies" },
  { id: "passport", label: "Passport" },
] as const;

export function validateBioStep(step: number, data: ProfileData, hasPhoto: boolean): string | null {
  if (step === 0) {
    if (!data.surname.trim() || !data.otherNames.trim() || !data.serviceNumber.trim() || !data.rate.trim()) {
      return "Please complete all bio data fields before continuing.";
    }
  } else if (step === 1) {
    if (!data.dateOfBirth.trim() || !data.gender.trim() || !data.phone.trim() || !data.about.trim()) {
      return "Please complete your personal information before continuing.";
    }
  } else if (step === 2) {
    if (!data.hobbies.trim()) {
      return "Please enter your hobbies before continuing.";
    }
  } else if (step === 3) {
    if (!hasPhoto) {
      return "Please upload your passport photograph to finish.";
    }
  }
  return null;
}


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
  embedded = false,
}: {
  user: AppUser;
  onSaveed: () => void;
  embedded?: boolean;
}) {
  const [data, setData] = useState<ProfileData>(EMPTY_PROFILE);
  const [step, setStep] = useState(0);
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
        if (d.photoUrl) setPhotoPreview(await signedUrl("profile-photos", d.photoUrl));
      }
    } catch {
      setMessage("Could not load your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [user.uid]);

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
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

  function handleNext() {
    const err = validateBioStep(step, data, Boolean(photoFile || data.photoUrl));
    if (err) {
      setMessage(err);
      return;
    }
    setMessage("");
    setStep(s => Math.min(s + 1, BIO_STEPS.length - 1));
  }

  function handleBack() {
    setMessage("");
    setStep(s => Math.max(s - 1, 0));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < BIO_STEPS.length - 1) {
      handleNext();
      return;
    }
    const err = validateBioStep(step, data, Boolean(photoFile || data.photoUrl));
    if (err) {
      setMessage(err);
      return;
    }
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
        dateOfBirth: data.dateOfBirth.trim(),
        gender: data.gender.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
        about: data.about.trim(),
        hobbies: data.hobbies.trim(),
        photoUrl,
        bioCompleted: true,
      };

      const { error } = await supabase.from("profiles").upsert({
        id: user.uid,
        email: user.email,
        surname: profileData.surname,
        other_names: profileData.otherNames,
        service_number: profileData.serviceNumber,
        rate: profileData.rate,
        date_of_birth: profileData.dateOfBirth,
        gender: profileData.gender,
        phone: profileData.phone,
        address: profileData.address,
        about: profileData.about,
        hobbies: profileData.hobbies,
        photo_url: profileData.photoUrl,
        bio_completed: true,
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
    if (embedded) return <p className="muted">Loading your profile...</p>;
    return (
      <main className="container">
        <img src={logoUrl.url} alt="RMACTS logo" className="brand-logo" />
        <h1>RMACTS Learning Hub</h1>
        <p className="panel">Loading your profile...</p>
      </main>
    );
  }

  const form = (
    <form className="panel profile-panel" onSubmit={handleSubmit} noValidate>
      <ol className="bio-steps" aria-label="Bio data steps">
        {BIO_STEPS.map((s, idx) => (
          <li key={s.id} className={`bio-step${idx === step ? " active" : ""}${idx < step ? " done" : ""}`}>
            <span className="bio-step-num">{idx + 1}</span>
            <span className="bio-step-label">{s.label}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <h2>Student Bio Data</h2>
          <label htmlFor="bio-surname">Surname</label>
          <input id="bio-surname" type="text" value={data.surname} onChange={e => setData({ ...data, surname: e.target.value })} required placeholder="e.g. Mensah" />

          <label htmlFor="bio-other-names">Other Names</label>
          <input id="bio-other-names" type="text" value={data.otherNames} onChange={e => setData({ ...data, otherNames: e.target.value })} required placeholder="e.g. Kwame Boateng" />

          <label htmlFor="bio-service-number">Service Number</label>
          <input id="bio-service-number" type="text" value={data.serviceNumber} onChange={e => setData({ ...data, serviceNumber: e.target.value })} required placeholder="e.g. SN-2024-0123" />

          <label htmlFor="bio-rate">Rate / Rank</label>
          <input id="bio-rate" type="text" value={data.rate} onChange={e => setData({ ...data, rate: e.target.value })} required placeholder="e.g. Ordinary Seaman" />
        </>
      )}

      {step === 1 && (
        <>
          <h2>Personal Information</h2>
          <label htmlFor="bio-dob">Date of Birth</label>
          <input id="bio-dob" type="date" value={data.dateOfBirth} onChange={e => setData({ ...data, dateOfBirth: e.target.value })} required />

          <label htmlFor="bio-gender">Gender</label>
          <select id="bio-gender" value={data.gender} onChange={e => setData({ ...data, gender: e.target.value })} required>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>

          <label htmlFor="bio-phone">Phone Number</label>
          <input id="bio-phone" type="tel" value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} required placeholder="e.g. +233 24 000 0000" />

          <label htmlFor="bio-address">Address / Unit (optional)</label>
          <input id="bio-address" type="text" value={data.address} onChange={e => setData({ ...data, address: e.target.value })} placeholder="e.g. Takoradi Naval Base" />

          <label htmlFor="bio-about">About Yourself</label>
          <textarea id="bio-about" rows={3} value={data.about} onChange={e => setData({ ...data, about: e.target.value })} required placeholder="Tell us a little about yourself and your training goals" />
        </>
      )}

      {step === 2 && (
        <>
          <h2>Hobbies &amp; Interests</h2>
          <label htmlFor="bio-hobbies">Your Hobbies</label>
          <textarea id="bio-hobbies" rows={4} value={data.hobbies} onChange={e => setData({ ...data, hobbies: e.target.value })} required placeholder="e.g. Swimming, reading maritime history, football, chess" />
        </>
      )}

      {step === 3 && (
        <>
          <h2>Upload Passport Photograph</h2>
          <div className="photo-section">
            <div className="photo-preview">
              {photoPreview ? (
                <img src={photoPreview} alt="Passport preview" />
              ) : (
                <span className="photo-placeholder">No photo</span>
              )}
            </div>
            <div className="photo-upload">
              <label htmlFor="bio-passport">Passport Photograph</label>
              <p className="muted">JPG or PNG, max 1MB. Large images are auto-compressed.</p>
              <input id="bio-passport" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
            </div>
          </div>
        </>
      )}

      <div className="step-actions">
        {step > 0 && (
          <button type="button" className="secondary" onClick={handleBack} disabled={saving}>
            Back
          </button>
        )}
        {step < BIO_STEPS.length - 1 ? (
          <button type="button" onClick={handleNext}>
            Next
          </button>
        ) : (
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : embedded ? "Save Profile" : "Finish & Go to Overview"}
          </button>
        )}
      </div>

      {message && <p className={message.includes("success") ? "" : "error-msg"}>{message}</p>}
    </form>
  );

  if (embedded) return form;

  return (
    <main className="container">
      <img src={logoUrl.url} alt="RMACTS logo" className="brand-logo" />
      <h1>RMACTS Learning Hub</h1>
      <p>Complete your student bio data to continue to your overview.</p>
      {form}
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
    dateOfBirth: data.date_of_birth,
    gender: data.gender,
    phone: data.phone,
    address: data.address,
    about: data.about,
    hobbies: data.hobbies,
    photoUrl: data.photo_url,
    bioCompleted: data.bio_completed,
  };
}
