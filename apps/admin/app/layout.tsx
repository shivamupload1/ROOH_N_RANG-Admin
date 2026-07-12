import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Studio | Rooh N Rang",
  description: "Private studio control room."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
