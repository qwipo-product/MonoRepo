"use client";
import { SiteLink as Link } from "./SiteLink";
import { useEffect, useRef, useState } from "react";
import { useSitePathname } from "../lib/navigation";
import { site } from "../data/site";
import { Arrow } from "./Arrow";

export function Header() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const pathname = useSitePathname();
  // Native anchors keep repeated same-page section navigation reliable.
  const SectionLink = Link;
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  return (
    <header className="site-header">
      <Link
        className="brand"
        href="/"
        aria-label="DigiDukaan by Qwipo home"
        onClick={() => setOpen(false)}
      >
        <img
          src="./images/qwipo-mark.webp"
          alt=""
          width={38}
          height={38}
          className="brand-mark"
        />
        <span className="brand-type">
          DigiDukaan<span> BY QWIPO</span>
        </span>
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {site.navigation.map((link) => (
          <SectionLink className="nav-link" key={link.label} href={link.href}>
            {link.label}
          </SectionLink>
        ))}
      </nav>
      <SectionLink className="header-cta" href="/#contact">
        <span>Let’s talk</span>
        <Arrow diagonal />
      </SectionLink>
      <button
        ref={button}
        className="menu-button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(!open)}
      >
        <span>{open ? "Close" : "Menu"}</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <nav
        id="mobile-nav"
        className="mobile-nav"
        aria-label="Mobile navigation"
        hidden={!open}
      >
        {site.navigation.map((link, i) => (
          <SectionLink
            key={link.label}
            href={link.href}
            onClick={() => setOpen(false)}
          >
            <span>0{i + 1}</span>
            {link.label}
            <Arrow diagonal />
          </SectionLink>
        ))}
        <Link
          href="/how-it-works"
          aria-current={pathname === "/how-it-works" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <span>04</span>How it works
          <Arrow diagonal />
        </Link>
        <SectionLink href="/#contact" onClick={() => setOpen(false)}>
          <span>05</span>Let’s talk
          <Arrow diagonal />
        </SectionLink>
      </nav>
    </header>
  );
}
