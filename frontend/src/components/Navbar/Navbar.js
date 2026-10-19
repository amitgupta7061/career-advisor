"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.navContainer}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 2L26 8V20L14 26L2 20V8L14 2Z"
                fill="url(#logoGrad)"
                stroke="white"
                strokeWidth="0.5"
              />
              <path
                d="M14 10C15.6569 10 17 11.3431 17 13C17 14.6569 15.6569 16 14 16C12.3431 16 11 14.6569 11 13C11 11.3431 12.3431 10 14 10Z"
                fill="white"
              />
              <path d="M14 16V22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 18L14 16L18 18" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="logoGrad" x1="2" y1="2" x2="26" y2="26">
                  <stop stopColor="#6366f1" />
                  <stop offset="0.5" stopColor="#8b5cf6" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className={styles.logoText}>
            Path<span className={styles.logoHighlight}>Finder</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#how-it-works" className={styles.navLink}>How It Works</a>
          <a href="#testimonials" className={styles.navLink}>Testimonials</a>
          <a href="#pricing" className={styles.navLink}>Pricing</a>
        </div>

        {/* Auth Buttons */}
        <div className={styles.navActions}>
          <Link href="/login" className={`btn btn-ghost ${styles.loginBtn}`}>
            Log In
          </Link>
          <Link href="/signup" className={`btn btn-primary ${styles.signupBtn}`}>
            Get Started Free
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className={`${styles.mobileToggle} ${mobileOpen ? styles.open : ""}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ""}`}>
        <a href="#features" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Features</a>
        <a href="#how-it-works" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>How It Works</a>
        <a href="#testimonials" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Testimonials</a>
        <a href="#pricing" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Pricing</a>
        <div className={styles.mobileDivider}></div>
        <Link href="/login" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Log In</Link>
        <Link href="/signup" className={`btn btn-primary ${styles.mobileCta}`} onClick={() => setMobileOpen(false)}>
          Get Started Free
        </Link>
      </div>
    </nav>
  );
}
