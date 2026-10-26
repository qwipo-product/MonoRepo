import { useId, useState } from "react";
import { site } from "../data/site";
import { Arrow } from "./Arrow";

export function Contact() {
  const id = useId();
  const [role, setRole] = useState(site.contact.roles[0]);
  const [company, setCompany] = useState("");
  const message = `Hello Qwipo team,\n\nI would like to discuss DigiDukaan 2.0 for our business.\n\nBusiness type: ${role}\nCompany: ${company.trim() || "[Your company]"}\nLocation / markets: [Your markets]\nWhat we would like to explore: [Tell us about your seller network and delivery coverage]\n\nBest regards,\n[Your name]`;
  const href = `mailto:${site.email}?subject=${encodeURIComponent(`DigiDukaan partnership enquiry${company.trim() ? `: ${company.trim()}` : ""}`)}&body=${encodeURIComponent(message)}`;
  return (
    <section
      className="contact-section"
      id="contact"
      aria-labelledby={`${id}-title`}
    >
      <div className="section-top">
        <span className="eyebrow">{site.contact.label}</span>
        <span className="tiny-route" aria-hidden="true">
          ● ───────── ↗
        </span>
      </div>
      <div className="contact-grid">
        <div>
          <h2 id={`${id}-title`} data-reveal>
            {site.contact.heading.map((line, i) => (
              <span key={line} className={i === 2 ? "accent-text" : ""}>
                {line}{" "}
              </span>
            ))}
          </h2>
          <p className="contact-description">{site.contact.text}</p>
        </div>
        <div className="enquiry-panel">
          <p className="enquiry-label">
            Every good partnership starts with a hello.
          </p>
          <fieldset>
            <legend>I’m here as</legend>
            <div className="role-options">
              {site.contact.roles.map((item) => (
                <label key={item} className={role === item ? "selected" : ""}>
                  <input
                    type="radio"
                    name={`${id}-business-role`}
                    value={item}
                    checked={role === item}
                    onChange={() => setRole(item)}
                  />
                  <span>{item}</span>
                  <span className="radio-mark" aria-hidden="true" />
                </label>
              ))}
            </div>
          </fieldset>
          <label className="company-label" htmlFor={`${id}-company`}>
            Company <span>(optional)</span>
          </label>
          <input
            className="company-input"
            id={`${id}-company`}
            name="organization"
            autoComplete="organization"
            maxLength={120}
            placeholder="Your company name…"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <a className="contact-action" href={href}>
            <span>{site.contact.button}</span>
            <Arrow diagonal />
          </a>
          <p className="enquiry-note">{site.contact.note}</p>
          <a className="contact-email" href={`mailto:${site.email}`}>
            {site.email}
            <Arrow diagonal />
          </a>
        </div>
      </div>
    </section>
  );
}
