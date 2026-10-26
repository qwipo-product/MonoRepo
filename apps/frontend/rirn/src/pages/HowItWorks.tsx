import { OrderJourney } from "../components/OrderJourney";
import { Logistics } from "../components/Logistics";
import { PageTransition } from "../components/PageTransition";
import { site } from "../data/site";
import { Action } from "../components/Action";
import { Contact } from "../components/Contact";

export default function HowItWorks() {
  return (
    <PageTransition>
      <section className="detail-hero section-space">
        <div className="eyebrow">{site.details.eyebrow}</div>
        <h1 data-intro>{site.details.heading}</h1>
        <div className="detail-lead">
          <p>{site.details.intro}</p>
          <Action href="#journey-detail">Follow an order</Action>
        </div>
        <span className="detail-route" aria-hidden="true">
          ↳
        </span>
      </section>
      <section
        className="order-journey-section section-space"
        id="journey-detail"
        aria-label="The order journey"
      >
        <div className="story-intro">
          <span className="eyebrow">FIVE STEPS. ONE CONNECTED JOURNEY.</span>
          <p>
            Explore one step at a time. Open the detail only when you want more.
          </p>
        </div>
        <OrderJourney />
      </section>
      <Logistics />
      <section className="faq-section section-space">
        <div className="section-top">
          <span className="eyebrow">A FEW GOOD QUESTIONS</span>
          <span aria-hidden="true">↗</span>
        </div>
        <div className="faq-grid">
          <h2>
            Built around <br />
            the real world.
          </h2>
          <div>
            {site.details.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>
                  {faq.question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <Contact />
    </PageTransition>
  );
}
