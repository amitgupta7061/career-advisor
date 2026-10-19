import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGlow}></div>
      <div className={`container ${styles.footerContent}`}>
        {/* Top Section */}
        <div className={styles.footerTop}>
          {/* Brand */}
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.footerLogo}>
              <div className={styles.logoIcon}>
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" fill="url(#footerLogoGrad)" />
                  <path d="M14 10C15.6569 10 17 11.3431 17 13C17 14.6569 15.6569 16 14 16C12.3431 16 11 14.6569 11 13C11 11.3431 12.3431 10 14 10Z" fill="white"/>
                  <path d="M14 16V22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="footerLogoGrad" x1="2" y1="2" x2="26" y2="26">
                      <stop stopColor="#6366f1"/><stop offset="1" stopColor="#a855f7"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className={styles.logoText}>Path<span className={styles.logoHighlight}>Finder</span></span>
            </Link>
            <p className={styles.footerDesc}>
              AI-powered career guidance that adapts to your unique journey. Discover your perfect career path today.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialLink} aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" className={styles.socialLink} aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              <a href="#" className={styles.socialLink} aria-label="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className={styles.footerLinksGrid}>
            <div className={styles.footerCol}>
              <h4 className={styles.colTitle}>Product</h4>
              <Link href="#features" className={styles.footerLink}>Features</Link>
              <Link href="#pricing" className={styles.footerLink}>Pricing</Link>
              <Link href="#" className={styles.footerLink}>Integrations</Link>
              <Link href="#" className={styles.footerLink}>Changelog</Link>
            </div>
            <div className={styles.footerCol}>
              <h4 className={styles.colTitle}>Resources</h4>
              <Link href="#" className={styles.footerLink}>Documentation</Link>
              <Link href="#" className={styles.footerLink}>Career Blog</Link>
              <Link href="#" className={styles.footerLink}>Skill Library</Link>
              <Link href="#" className={styles.footerLink}>API Reference</Link>
            </div>
            <div className={styles.footerCol}>
              <h4 className={styles.colTitle}>Company</h4>
              <Link href="#" className={styles.footerLink}>About Us</Link>
              <Link href="#" className={styles.footerLink}>Contact</Link>
              <Link href="#" className={styles.footerLink}>Careers</Link>
              <Link href="#" className={styles.footerLink}>Privacy Policy</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © 2026 PathFinder AI. All rights reserved.
          </p>
          <div className={styles.bottomLinks}>
            <Link href="#" className={styles.bottomLink}>Terms</Link>
            <Link href="#" className={styles.bottomLink}>Privacy</Link>
            <Link href="#" className={styles.bottomLink}>Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
