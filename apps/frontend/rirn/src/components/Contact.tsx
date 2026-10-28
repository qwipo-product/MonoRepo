"use client";
import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { site } from "../data/site";
import {
  buildContactPayload,
  submitContact,
  validateContactFields,
} from "../lib/contact";
import type { ContactErrors, ContactFields } from "../lib/contact";
import { Arrow } from "./Arrow";

const fields = [
  {
    name: "first_name",
    label: "First name",
    autoComplete: "given-name",
    type: "text",
    maxLength: 80,
    placeholder: "First name",
  },
  {
    name: "last_name",
    label: "Last name",
    autoComplete: "family-name",
    type: "text",
    maxLength: 80,
    placeholder: "Last name",
  },
  {
    name: "email",
    label: "Email address",
    autoComplete: "email",
    type: "email",
    maxLength: 254,
    placeholder: "you@company.com",
  },
  {
    name: "phone",
    label: "Phone number",
    autoComplete: "tel",
    type: "tel",
    maxLength: 30,
    placeholder: "e.g. 9876543210",
  },
  {
    name: "company",
    label: "Company",
    autoComplete: "organization",
    type: "text",
    maxLength: 120,
    placeholder: "Your company name",
    optional: true,
  },
] as const;

export function Contact() {
  const id = useId();
  const [role, setRole] = useState(site.contact.roles[0]);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [failure, setFailure] = useState("");
  const inFlight = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const values: ContactFields = {
      first_name: String(data.get("first_name") ?? ""),
      last_name: String(data.get("last_name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      company: String(data.get("company") ?? ""),
      business_type: role,
      message: String(data.get("message") ?? ""),
    };
    const nextErrors = validateContactFields(values);
    setErrors(nextErrors);
    setFailure("");
    if (Object.keys(nextErrors).length) {
      setStatus("idle");
      const firstInvalid = form.elements.namedItem(Object.keys(nextErrors)[0]);
      if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
      return;
    }

    inFlight.current = true;
    setStatus("sending");
    try {
      await submitContact(buildContactPayload(values));
      form.reset();
      setRole(site.contact.roles[0]);
      setStatus("success");
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : "Please try again, or contact us by email below.",
      );
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }

  function handleInput(event: FormEvent<HTMLFormElement>) {
    if (status !== "sending") setStatus("idle");
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      const name = target.name as keyof ContactFields;
      if (errors[name])
        setErrors((current) => ({ ...current, [name]: undefined }));
    }
  }

  return (
    <section
      className="contact-section"
      id="contact"
      aria-labelledby={`${id}-title`}
    >
      <div className="section-top">
        <span className="eyebrow">{site.contact.label}</span>
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
        <form
          className="enquiry-panel"
          onSubmit={handleSubmit}
          onInput={handleInput}
          noValidate
          aria-label="Partnership enquiry"
        >
          <p className="enquiry-label">
            Every good partnership starts with a hello.
          </p>
          <p className="enquiry-required">
            All fields are required except company.
          </p>
          <fieldset
            disabled={status === "sending"}
            className="enquiry-fields"
            aria-label="Your enquiry details"
          >
            <fieldset>
              <legend>I’m here as</legend>
              <div className="role-options">
                {site.contact.roles.map((item) => (
                  <label key={item} className={role === item ? "selected" : ""}>
                    <input
                      type="radio"
                      name="business_type"
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
            <div className="enquiry-form-grid">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className={`enquiry-field${field.name === "first_name" || field.name === "last_name" ? " enquiry-field-half" : ""}`}
                >
                  <label
                    className="company-label"
                    htmlFor={`${id}-${field.name}`}
                  >
                    {field.label}
                    {"optional" in field ? <span> (optional)</span> : null}
                  </label>
                  <input
                    className="company-input"
                    id={`${id}-${field.name}`}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    maxLength={field.maxLength}
                    placeholder={field.placeholder}
                    required={!("optional" in field)}
                    aria-invalid={Boolean(errors[field.name])}
                    aria-describedby={
                      errors[field.name]
                        ? `${id}-${field.name}-error`
                        : undefined
                    }
                  />
                  {errors[field.name] ? (
                    <p
                      className="enquiry-field-error"
                      id={`${id}-${field.name}-error`}
                    >
                      {errors[field.name]}
                    </p>
                  ) : null}
                </div>
              ))}
              <div className="enquiry-field">
                <label className="company-label" htmlFor={`${id}-message`}>
                  How can we help?
                </label>
                <textarea
                  className="company-input enquiry-message"
                  id={`${id}-message`}
                  name="message"
                  rows={3}
                  maxLength={4000}
                  placeholder="Tell us about your business and what you’d like to explore…"
                  required
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? `${id}-message-error` : undefined
                  }
                />
                {errors.message ? (
                  <p className="enquiry-field-error" id={`${id}-message-error`}>
                    {errors.message}
                  </p>
                ) : null}
              </div>
            </div>
            <button
              className="contact-action"
              type="submit"
              disabled={status === "sending"}
            >
              <span>
                {status === "sending"
                  ? "Sending enquiry…"
                  : site.contact.button}
              </span>
              <Arrow diagonal />
            </button>
          </fieldset>
          <p
            className="enquiry-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {status === "sending"
              ? "Sending your enquiry…"
              : status === "success"
                ? "Thank you. Your enquiry has been submitted to Qwipo."
                : ""}
          </p>
          {status === "error" ? (
            <p className="enquiry-status enquiry-failure" role="alert">
              {failure}
            </p>
          ) : null}
          <p className="enquiry-note">{site.contact.note}</p>
          <a className="contact-email" href={`mailto:${site.email}`}>
            {site.email}
            <Arrow diagonal />
          </a>
        </form>
      </div>
    </section>
  );
}
