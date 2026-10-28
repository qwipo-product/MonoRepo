import { SiteLink as Link } from "./SiteLink";
import { site } from "../data/site";
import { Arrow } from "./Arrow";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <p>
          Everyday commerce.
          <br />
          Extraordinary possibility.
        </p>
        <div className="footer-links">
          <Link href="/about-qwipo">
            About Qwipo
            <Arrow diagonal />
          </Link>
          <a href={site.appUrl} target="_blank" rel="noreferrer">
            Get the app
            <Arrow diagonal />
          </a>
          <Link href="/how-it-works">
            How it works
            <Arrow diagonal />
          </Link>
        </div>
        <a className="back-top" href="#top" aria-label="Back to top">
          ↑
        </a>
      </div>
      <div className="footer-wordmark" aria-hidden="true">
        DigiDukaan
      </div>
      <div className="footer-bottom">
        <span>© 2026 Qwipo. All rights reserved.</span>
        <span>Built for the business of everyday.</span>
        <span>A QWIPO PRODUCT</span>
      </div>
    </footer>
  );
}
