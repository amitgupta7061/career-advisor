import "./globals.css";

export const metadata = {
  title: "PathFinder AI — Your Personalized Career & Education Advisor",
  description:
    "AI-powered platform that recommends career paths, identifies skill gaps, generates personalized learning roadmaps, and discovers opportunities tailored to your profile.",
  keywords: [
    "career advisor",
    "AI career guidance",
    "skill gap analysis",
    "learning roadmap",
    "personalized education",
    "career recommendation",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
