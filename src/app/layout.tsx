import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import AuthLayout from "@/components/AuthLayout";
import Navbar from "@/components/Navbar";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ploopp | Drop & Pop!",
  description: "Drop a secret. Pop a surprise. Find what your friends left nearby!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased selection:bg-primary selection:text-white`}>
        <AuthLayout>
          <Navbar />
          {children}
        </AuthLayout>
      </body>
    </html>
  );
}
