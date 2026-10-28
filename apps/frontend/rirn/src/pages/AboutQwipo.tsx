import { Action } from "../components/Action";
import { Arrow } from "../components/Arrow";
import { Contact } from "../components/Contact";
import { PageTransition } from "../components/PageTransition";
import { ProgressiveImage } from "../components/ProgressiveImage";
import { site } from "../data/site";


export default function AboutQwipo() {
  return (
    <PageTransition>
      <section className="company-hero section-space" aria-labelledby="company-title">
        <div className="company-identity">
          <img src="./images/qwipo-mark.webp" alt="" width={44} height={44} />
          <span>Qwipo</span>
          <span className="eyebrow">{site.qwipo.label}</span>
        </div>
        <div className="company-hero-grid">
          <div className="company-hero-copy">
            <h1 id="company-title" data-intro>
              {site.qwipo.heading.map((line) => <span key={line}>{line} </span>)}
            </h1>
            <p>{site.qwipo.text}</p>
            <Action href="#contact">Talk partnerships</Action>
          </div>
          <figure className="company-photo">
            <ProgressiveImage
              asset="delivery"
              alt="A delivery team member handling stock beside a loaded distribution truck"
              sizes="(max-width: 700px) 90vw, 38vw"
              priority
            />
            <figcaption>Technology built around the work on the ground.</figcaption>
          </figure>
        </div>
      </section>

      <section className="company-relationship section-space" aria-labelledby="relationship-title">
        <div className="company-relationship-copy">
          <span className="eyebrow">HOW QWIPO AND DIGIDUKAAN FIT TOGETHER</span>
          <h2 id="relationship-title" data-reveal>{site.qwipo.relationship.heading}</h2>
          <p>{site.qwipo.relationship.text}</p>
          <Action href="/#product" light>Explore DigiDukaan</Action>
        </div>
        <div className="company-family">
          <div className="company-family-parent">
            <span className="eyebrow">THE COMPANY</span>
            <h3>Qwipo</h3>
            <p>{site.qwipo.relationship.company}</p>
          </div>
          <div className="company-family-product">
            <span className="eyebrow">A QWIPO PRODUCT</span>
            <h3>DigiDukaan</h3>
            <p>{site.qwipo.relationship.product}</p>
          </div>
          <p className="company-family-note">{site.qwipo.relationship.note}</p>
        </div>
      </section>

      <section className="company-capabilities section-space" aria-labelledby="capabilities-title">
        <div className="section-top">
          <span className="eyebrow">BEYOND THE ORDERING SCREEN</span>
        </div>
        <div className="section-intro">
          <h2 id="capabilities-title" data-reveal>Around every order.</h2>
          <p>Connect digital demand with the systems and delivery operations that serve it.</p>
        </div>
        <div className="company-capability-list">
          {site.qwipo.capabilities.map((capability) => (
            <article key={capability.label}>
              <div>
                <span className="eyebrow">{capability.label}</span>
                <h3>{capability.title}</h3>
              </div>
              <div>
                <p>{capability.text}</p>
                <p className="company-capability-detail">{capability.detail}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="company-external">
          <p>Looking for more about the company?</p>
          <a href={site.companyUrl} className="text-link" target="_blank" rel="noreferrer">
            Visit qwipo.com <Arrow diagonal />
          </a>
        </div>
      </section>
      <Contact />
    </PageTransition>
  );
}
