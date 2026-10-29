import { Action } from "../components/Action";
import { Arrow } from "../components/Arrow";
import { Contact } from "../components/Contact";
import { PageTransition } from "../components/PageTransition";
import { site } from "../data/site";

export default function QwipoForDigiDukaan() {
  return (
    <PageTransition>
      <section
        className="company-hero section-space"
        aria-labelledby="company-title"
      >
        <div className="company-identity">
          <img src="./images/qwipo-mark.webp" alt="" width={44} height={44} />
          <span>Qwipo</span>
          <span className="eyebrow">{site.qwipo.label}</span>
        </div>
        <div className="company-hero-grid">
          <div className="company-hero-copy">
            <h1 id="company-title" data-intro>
              {site.qwipo.heading.map((line) => (
                <span key={line}>{line} </span>
              ))}
            </h1>
            <p>{site.qwipo.text}</p>
            <Action href="#contribution">Explore Qwipo’s role</Action>
          </div>
          <figure className="technology-map">
            <div className="technology-map-top">
              <span className="eyebrow">WHAT THE RETAILER USES</span>
              <strong>DigiDukaan</strong>
              <p>Discover. Connect. Order.</p>
            </div>
            <div className="technology-map-core">
              <span className="eyebrow">WHAT QWIPO PROVIDES</span>
              <strong>Connected software</strong>
              <p>
                App experience · Network integration
                <br />
                Seller-system connections · Logistics tools
              </p>
            </div>
            <div className="technology-map-base">
              <span className="eyebrow">WHAT IT WORKS WITH</span>
              <strong>ONDC & seller systems</strong>
              <p>Open network standards and agreed data connections.</p>
            </div>
            <figcaption>
              A view of technology roles. Physical delivery is handled by the
              distributor’s fleet or an approved 3PL partner.
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        className="provider-roles section-space"
        aria-labelledby="roles-title"
      >
        <div>
          <span className="eyebrow">HOW THE RESPONSIBILITIES FIT</span>
          <h2 id="roles-title" data-reveal>
            Clear roles.
            <br />A connected experience.
          </h2>
        </div>
        <dl>
          <div>
            <dt>ONDC</dt>
            <dd>
              Provides the open network standards that participating buyer and
              seller systems use to transact.
            </dd>
          </div>
          <div>
            <dt>Qwipo</dt>
            <dd>
              Builds and integrates the software that supports DigiDukaan’s
              ordering and operational workflows.
            </dd>
          </div>
          <div>
            <dt>Distributors & wholesalers</dt>
            <dd>
              Supply the products, set their commercial terms and accept and
              prepare retailer orders.
            </dd>
          </div>
          <div>
            <dt>Delivery teams</dt>
            <dd>
              The distributor’s fleet handles fulfillment, with approved
              third-party logistics capacity where required.
            </dd>
          </div>
        </dl>
      </section>

      <section
        className="company-capabilities section-space"
        id="contribution"
        aria-labelledby="capabilities-title"
      >
        <div className="section-top">
          <span className="eyebrow">QWIPO’S CONTRIBUTION</span>
        </div>
        <div className="section-intro">
          <h2 id="capabilities-title" data-reveal>
            What Qwipo
            <br />
            makes possible.
          </h2>
          <p>
            The technology connects what the retailer sees with the systems and
            teams serving the order.
          </p>
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
      </section>

      <section
        className="data-story section-space"
        aria-labelledby="data-story-title"
      >
        <div className="section-intro">
          <h2 id="data-story-title" data-reveal>
            One order.
            <br />
            Two directions of information.
          </h2>
          <p>
            In a configured DMS integration, the seller’s system remains the
            source for its master data. Qwipo connects that information with
            ordering channels.
          </p>
        </div>
        <ol className="data-flow">
          <li>
            <span className="eyebrow">BEFORE THE ORDER</span>
            <h3>Catalogue, prices, stock & schemes</h3>
            <p>Seller’s DMS → Qwipo connector → ordering channels</p>
          </li>
          <li>
            <span className="eyebrow">WHEN THE RETAILER ORDERS</span>
            <h3>Order capture & status updates</h3>
            <p>
              Retailer’s order → connected seller system. Status updates return
              through the agreed integration.
            </p>
          </li>
        </ol>
        <p className="data-scope">
          Supported interfaces, data permissions and update frequency are agreed
          per system. Delivery planning and physical transport follow the
          configured operating workflow.
        </p>
        <Action href="/how-it-works" light>
          Follow the retailer’s journey
        </Action>
      </section>

      <section
        className="partner-discussion section-space"
        aria-labelledby="discussion-title"
      >
        <span className="eyebrow">
          FOR BRANDS, DISTRIBUTORS & TECHNOLOGY TEAMS
        </span>
        <h2 id="discussion-title">Start with your network.</h2>
        <p>
          Tell us which retailers you want to serve, which seller systems you
          use and how orders are delivered today. Those details shape the
          technology and integration scope.
        </p>
        <div className="company-external">
          <span>More about Qwipo’s wider business</span>
          <a
            href={site.companyUrl}
            className="text-link"
            target="_blank"
            rel="noreferrer"
          >
            Visit qwipo.com <Arrow diagonal />
          </a>
        </div>
      </section>
      <Contact />
    </PageTransition>
  );
}
