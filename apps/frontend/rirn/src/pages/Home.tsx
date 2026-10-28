import { ProgressiveImage } from "../components/ProgressiveImage";
import { OrbitProductDevice } from "../components/OrbitProductDevice";
import { JourneyIcon } from "../components/JourneyIcon";
import { NetworkScene } from "../components/NetworkScene";
import { Logistics } from "../components/Logistics";
import { PageTransition } from "../components/PageTransition";
import { SiteLink as Link } from "../components/SiteLink";
import { site } from "../data/site";
import { Action } from "../components/Action";
import { Arrow } from "../components/Arrow";
import { RouteArtwork } from "../components/RouteArtwork";
import { Audience } from "../components/Audience";
import { Contact } from "../components/Contact";
import { OndcStory } from "../components/OndcStory";

export default function Home() {
  return (
    <PageTransition>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-overline">
          <span className="eyebrow">{site.hero.eyebrow}</span>
          <span className="hero-edition">DIGITAL ORDERING / HUMAN CONNECTIONS</span>
        </div>
        <div className="hero-content">
          <div className="hero-copy">
            <h1 id="hero-title">
              <span data-intro>Beyond </span>
              <span data-intro>
                the beat<span className="hero-period">.</span>
              </span>
            </h1>
            <p className="hero-description">{site.hero.description}</p>
            <div className="hero-actions">
              <Action href="#contact">{site.hero.primary}</Action>
              <a className="hero-secondary" href="#network">
                {site.hero.secondary}
                <span aria-hidden="true">
                  <JourneyIcon name="scroll" />
                </span>
              </a>
            </div>
          </div>
          <RouteArtwork />
        </div>
        <div className="hero-bottom">
          <span className="hero-bottom-note">
            <span className="crosshair" aria-hidden="true">
              ＋
            </span>
            {site.hero.footnote}
          </span>
          <a href="#opportunity" className="scroll-link">
            SCROLL TO CONNECT<span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section
        className="opportunity section-space"
        id="opportunity"
        aria-labelledby="opportunity-title"
      >
        <div className="section-top">
          <span className="eyebrow">{site.opportunity.label}</span>
        </div>
        <div className="section-intro">
          <h2 id="opportunity-title" data-reveal>
            {site.opportunity.heading.map((line) => (
              <span key={line}>{line} </span>
            ))}
          </h2>
          <p>{site.opportunity.intro}</p>
        </div>
        <div className="opportunity-grid">
          <figure className="retailer-figure">
            <div className="photo-window">
              <ProgressiveImage
                asset="retailer"
                alt="A retailer using a phone at the counter of a stocked neighbourhood store"
                sizes="(max-width: 700px) 90vw, 44vw"
              />
            </div>
            <figcaption>{site.opportunity.caption}</figcaption>
          </figure>
          <Audience />
        </div>
      </section>

      <section
        className="product-section section-space"
        id="product"
        aria-labelledby="product-title"
      >
        <div className="section-top">
          <span className="eyebrow">{site.product.label}</span>
          <span className="product-kicker">
            A SMALL SCREEN. A BIGGER CONNECTION.
          </span>
        </div>
        <div className="product-grid">
          <div className="product-stage">
            <span className="product-orbit orbit-one" aria-hidden="true" />
            <span className="product-orbit orbit-two" aria-hidden="true" />
            <p className="product-stage-word">
              <span>Discover.</span>
              <span>Order.</span>
              <span>Repeat.</span>
            </p>
            <div className="product-phone">
              <OrbitProductDevice review={import.meta.env.DEV} />
            </div>
            <div className="product-stage-label">
              <span className="status-dot" />
              DIGIDUKAAN
            </div>
          </div>
          <div className="product-copy">
            <h2 id="product-title" data-reveal>
              {site.product.heading.map((line) => (
                <span key={line}>{line} </span>
              ))}
            </h2>
            <p className="product-intro">{site.product.intro}</p>
            <div className="feature-list">
              {site.product.features.map((feature) => (
                <article key={feature.number}>
                  <span className="feature-number">{feature.number}</span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                  <span className="feature-stop" aria-hidden="true" />
                </article>
              ))}
            </div>
            <a
              className="text-link"
              href={site.appUrl}
              target="_blank"
              rel="noreferrer"
            >
              Explore the retailer app
              <Arrow diagonal />
            </a>
          </div>
        </div>
        <p className="product-disclaimer">{site.product.caption}</p>
      </section>

      <OndcStory />

      <section
        className="journey section-space"
        id="network"
        aria-labelledby="network-title"
        data-journey
      >
        <div className="section-top">
          <span className="eyebrow">{site.journey.label}</span>
        </div>
        <div className="section-intro">
          <h2 id="network-title" data-reveal>
            {site.journey.heading.map((line) => (
              <span key={line}>{line} </span>
            ))}
          </h2>
          <p>{site.journey.intro}</p>
        </div>
        <div className="journey-flow">
          <div className="journey-track" aria-hidden="true">
            <div className="journey-track-line" />
            <div className="journey-progress" data-journey-progress />
            <div className="journey-traveller" data-journey-traveller>
              <span className="journey-tail" />
            </div>
          </div>
          <ol className="journey-steps">
            {site.journey.steps.map((step, i) => (
              <li key={step.number} data-step={i}>
                <div className="step-art" data-journey-art>
                  <NetworkScene stage={i} />
                </div>
                <span className="step-route-stop" aria-hidden="true" />
                <div className="step-copy">
                  <div className="step-heading">
                    <p className="step-tag">{step.tag}</p>
                    <h3>
                      <span className="step-index" aria-hidden="true">
                        {step.number}
                      </span>
                      <span className="step-name">
                        <span
                          className="step-highlight"
                          data-journey-highlight
                          aria-hidden="true"
                        />
                        {step.name}
                      </span>
                    </h3>
                  </div>
                  <p className="step-description">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="journey-bottom">
          <p>
            <strong>Built around the beat.</strong> {site.journey.note}
          </p>
          <Link href="/how-it-works" className="text-link journey-cta">
            <span
              className="journey-shimmer"
              data-journey-shimmer
              aria-hidden="true"
            />
            <span>Follow the full journey</span>
            <Arrow diagonal />
          </Link>
        </div>
      </section>

      <Logistics compact />

      <Contact />
    </PageTransition>
  );
}
