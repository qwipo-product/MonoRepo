"use client";
import { useState } from "react";
import { site } from "../data/site";
import { Arrow } from "./Arrow";

export function Audience() {
  const [selected, setSelected] = useState(0);
  const audience = site.audiences[selected];
  return (
    <div className="audience">
      <div
        className="audience-switch"
        role="group"
        aria-label="Choose your business type"
      >
        {site.audiences.map((item, i) => (
          <button
            key={item.id}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="audience-content" key={audience.id} aria-live="polite">
        <h3>{audience.title}</h3>
        <p>{audience.text}</p>
        <ul>
          {audience.items.map((item) => (
            <li key={item}>
              {item}
            </li>
          ))}
        </ul>
        <a href="#contact" className="text-link">
          {audience.cta}
          <Arrow diagonal />
        </a>
      </div>
    </div>
  );
}
