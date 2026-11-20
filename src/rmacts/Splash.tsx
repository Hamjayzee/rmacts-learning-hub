import { useEffect, useRef } from "react";
import logoUrl from "./assets/rmacts-logo.png.asset.json";

export const SPLASH_MS = 10000;

export default function Splash({ onDone }: { onDone: () => void }) {
  const done = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      onDone();
    }, SPLASH_MS);
    return () => clearTimeout(id);
  }, [onDone]);

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
      </div>
    </main>
  );
}
