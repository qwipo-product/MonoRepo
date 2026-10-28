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
  const contactHref = pathname === "/about-qwipo" || pathname === "/how-it-works"
    ? "#contact" : "/#contact";
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
        aria-label="DigiDukaan home"
        onClick={() => setOpen(false)}
      >
        <img
          className="brand-logo"
          src="./images/brand/digidukaan-logo.svg"
          width={248}
          height={56}
          alt=""
          loading="eager"
        />
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {site.navigation.map((link) => (
          <Link className="nav-link" key={link.label} href={link.href}
            aria-current={pathname === link.href ? "page" : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>
      <Link className="header-cta" href={contactHref}>
        <span>Let’s talk</span>
        <Arrow diagonal />
      </Link>
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
          <Link
            key={link.label}
            href={link.href}
            aria-current={pathname === link.href ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            <span>0{i + 1}</span>
            {link.label}
            <Arrow diagonal />
          </Link>
        ))}
        <Link
          href="/how-it-works"
          aria-current={pathname === "/how-it-works" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <span>04</span>How it works
          <Arrow diagonal />
        </Link>
        <Link href={contactHref} onClick={() => setOpen(false)}>
          <span>05</span>Let’s talk
          <Arrow diagonal />
        </Link>
      </nav>
    </header>
  );
}
