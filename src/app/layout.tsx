import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Margin Dashboard",
  description: "Agency profitability dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
