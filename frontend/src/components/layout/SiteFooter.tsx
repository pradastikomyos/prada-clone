/**
 * SiteFooter — Prada-style footer with newsletter, social links,
 * company/legal columns, and copyright bar.
 * All links are placeholder (#) — purely aesthetic for demo.
 */

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Site footer">

      {/* Main footer grid */}
      <div className="site-footer__main">

        {/* Newsletter + Social */}
        <div className="site-footer__newsletter">
          <label className="site-footer__newsletter-label" htmlFor="footer-email">
            Insert your e-mail address
          </label>
          <div className="site-footer__newsletter-row">
            <input
              id="footer-email"
              type="email"
              className="site-footer__newsletter-input"
              placeholder="your@email.com"
              aria-label="Email address for newsletter"
            />
            <button type="button" className="site-footer__newsletter-btn" aria-label="Subscribe">
              →
            </button>
          </div>

          <div className="site-footer__social" aria-label="Social media links">
            {/* Facebook */}
            <a href="#" aria-label="Facebook" className="site-footer__social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            {/* X / Twitter */}
            <a href="#" aria-label="X (Twitter)" className="site-footer__social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" aria-label="Instagram" className="site-footer__social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            {/* YouTube */}
            <a href="#" aria-label="YouTube" className="site-footer__social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
              </svg>
            </a>
            {/* TikTok */}
            <a href="#" aria-label="TikTok" className="site-footer__social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Company links */}
        <div className="site-footer__col">
          <h3 className="site-footer__col-title">Company</h3>
          <ul className="site-footer__col-list">
            <li><a href="#">About Spark Stage</a></li>
            <li><a href="#">Spark Group</a></li>
            <li><a href="#">Sustainability</a></li>
            <li><a href="#">Work with us</a></li>
          </ul>
        </div>

        {/* Legal links */}
        <div className="site-footer__col">
          <h3 className="site-footer__col-title">Legal Terms and Conditions</h3>
          <ul className="site-footer__col-list">
            <li><a href="#">Legal Notice</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Cookie Policy</a></li>
            <li><a href="#">Cookie Settings</a></li>
            <li><a href="#">Sitemap</a></li>
          </ul>
        </div>

        {/* Help links */}
        <div className="site-footer__col">
          <h3 className="site-footer__col-title">Help</h3>
          <ul className="site-footer__col-list">
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Store Locator</a></li>
            <li><a href="#">Size Guide</a></li>
          </ul>
        </div>

      </div>

      {/* Copyright bar */}
      <div className="site-footer__bar">
        <p className="site-footer__copyright">
          ©Spark Stage 2024 – {new Date().getFullYear()}
        </p>
        <div className="site-footer__bar-links">
          <a href="#">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
            Store Locator
          </a>
          <a href="#">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Location: Indonesia / ID
          </a>
        </div>
      </div>

    </footer>
  );
}
