"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-secondary)",
        padding: "24px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "48px 36px",
          textAlign: "center",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🧭</div>
        <span
          className="badge badge-primary"
          style={{ marginBottom: "12px", fontSize: "0.8125rem", padding: "4px 12px" }}
        >
          404 — PAGE NOT FOUND
        </span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: "8px 0 12px 0",
            letterSpacing: "-0.02em",
          }}
        >
          Lost Your Career Path?
        </h1>
        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: "28px",
          }}
        >
          The page or resource you are looking for doesn&apos;t exist, has been moved, or is temporarily unavailable.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/dashboard" className="btn btn-primary">
            Go to Dashboard →
          </Link>
          <Link href="/" className="btn btn-outline">
            Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
