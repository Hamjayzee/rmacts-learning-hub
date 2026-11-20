import { useEffect, useRef, useState } from "react";
import logoUrl from "./assets/rmacts-logo.png.asset.json";

export const SPLASH_MS = 8000;

const STEPS = [
  "Preparing your learning hub…",
  "Loading course materials…",
  "Checking quizzes and assessments…",
  "Securing your session…",
  "Almost ready…",
];

export default function Splash({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / SPLASH_MS);
      setPct(Math.round(progress * 100));
      if (progress >= 1 && !done.current) {
        done.current = true;
        clearInterval(id);
        onDone();
      }
    }, 50);
    return () => clearInterval(id);
  }, [onDone]);

  const step = STEPS[Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length))];

  return (
    <main
      className="splash"
      role="status"
      aria-live="polite"
      aria-label="Loading Regional Maritime Awareness Capability Training School"
    >
      <div className="splash-card">
        <img src={logoUrl.url} alt="RMAC logo" className="splash-logo" />
        <h1 className="splash-title">Regional Maritime Awareness Capability Training School</h1>
        <p className="splash-loading">LOADING</p>
        <div className="splash-bars" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <span key={index} />)}</div>
        <div className="splash-track" aria-hidden="true">
          <div className="splash-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="splash-meta">
          <span>{step}</span>
          <span className="splash-pct">{pct}%</span>
        </div>
      </div>
    </main>
  );
}
