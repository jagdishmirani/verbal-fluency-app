import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verbal Fluency",
  description: "Local-first verbal fluency and word recall app",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
