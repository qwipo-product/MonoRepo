import { SiteLink as Link } from "./SiteLink";
import { Arrow } from "./Arrow";
import { site } from "../data/site";

export function OndcStory() {
  return (
    <section
      className="ondc-story section-space"
      id="ondc"
      aria-labelledby="ondc-title"
    >
      <div className="section-top">
        <span className="eyebrow">{site.ondc.label}</span>
      </div>
      <div className="section-intro">
        <h2 id="ondc-title" data-reveal>
          {site.ondc.heading.map((line) => (
            <span key={line}>{line} </span>
          ))}
        </h2>
        <p>{site.ondc.text}</p>
      </div>
      <div className="network-roles" aria-label="The roles in open commerce">
        {site.ondc.roles.map((role) => (
          <article key={role.name}>
            <span className="eyebrow">{role.role}</span>
            <h3>{role.name}</h3>
            <p>{role.text}</p>
          </article>
        ))}
      </div>
      <div className="ondc-context">
        <p>{site.ondc.meaning}</p>
        <a
          href={site.ondc.source}
          className="text-link"
          target="_blank"
          rel="noreferrer"
        >
          Read ONDC’s DigiDukaan overview <Arrow diagonal />
        </a>
      </div>
      <div className="technology-bridge">
        <p>
          <strong>Where does Qwipo fit?</strong> Qwipo provides technology for
          the app, system connections and supporting operations.
        </p>
        <Link href="/qwipo-for-digidukaan" className="text-link">
          Qwipo for DigiDukaan <Arrow diagonal />
        </Link>
      </div>
    </section>
  );
}
