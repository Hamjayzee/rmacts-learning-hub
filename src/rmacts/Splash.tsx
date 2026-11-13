import { useEffect, useRef, useState } from "react";
import logoUrl from "./assets/rmacts-logo.png.asset.json";

const SPLASH_MS = 8000;

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
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / SPLASH_MS);
      setPct(Math.round(progress * 100));
      if (progress >= 1) {
        if (!done.current) {
          done.current = true;
          onDone();
        }
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onDone]);

  const step = STEPS[Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length))];

  return (
    <main className="splash" role="status" aria-live="polite" aria-label="Loading RMACTS Learning Hub">
      <div className="splash-card">
        <img src={logoUrl.url} alt="RMACTS logo" className="splash-logo" />
        <h1 className="splash-title">RMACTS Learning Hub</h1>
        <p className="splash-sub">Maritime communication and technology learning, all in one place.</p>

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
