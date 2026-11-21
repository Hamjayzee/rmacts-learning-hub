import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "./assets/rmacts-logo.png.asset.json";
import operations from "./assets/operations-room.jpg.asset.json";

type MenuDestination = "about" | "gallery" | "history" | "contact" | "login";
const links: { label: string; destination: MenuDestination }[] = [
  { label: "About", destination: "about" },
  { label: "Gallery", destination: "gallery" },
  { label: "History", destination: "history" },
  { label: "Contact Us", destination: "contact" },
];

export default function MenuPage({ onNavigate }: { onNavigate: (destination: MenuDestination) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <main className="school-menu">
      <div className="school-welcome"><span>REGIONAL MARITIME AWARENESS CAPABILITY</span><span>WELCOME TO RMACTS</span></div>
      <header className="school-header">
        <div className="school-brand"><img src={logo.url} alt="RMAC logo" /><div><strong>RMACTS</strong><span>Regional Maritime Awareness Capability<br />Training School</span></div></div>
        <nav className="school-desktop-nav" aria-label="School navigation">
          {links.map(link => <Button variant="ghost" key={link.destination} onClick={() => onNavigate(link.destination)}>{link.label}</Button>)}
          <Button className="school-login" onClick={() => onNavigate("login")}>Learning Hub <ArrowRight /></Button>
        </nav>
        <Button variant="ghost" size="icon" className="school-menu-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="school-mobile-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
      </header>
      {open && <nav id="school-mobile-nav" className="school-mobile-nav" aria-label="Mobile school navigation">
        {links.map(link => <Button variant="ghost" key={link.destination} onClick={() => onNavigate(link.destination)}>{link.label}<ArrowRight /></Button>)}
        <Button className="school-login" onClick={() => onNavigate("login")}>Continue to Login <ArrowRight /></Button>
      </nav>}
      <section className="school-cover">
        <img className="school-cover-photo" src={operations.url} alt="Maritime command and control operations room" />
        <div className="school-cover-shade" />
        <div className="school-cover-content">
          <p className="school-kicker">FROM SURVEILLANCE TO SECURITY</p>
          <h1>Regional Maritime Awareness<br className="school-title-break" /> Capability Training School</h1>
          <div className="school-divider" />
          <p className="school-motto">Shared security in the maritime world</p>
        </div>
        <div className="school-cover-footer"><span>REGIONAL MARITIME AWARENESS CAPABILITY</span><span>RMACTS · LEARNING HUB</span></div>
        <nav className="school-section-nav" aria-label="Explore the school">
          {links.map(link => <Button variant="ghost" key={link.destination} onClick={() => onNavigate(link.destination)}>{link.label}<ArrowRight /></Button>)}
        </nav>
      </section>
    </main>
  );
}