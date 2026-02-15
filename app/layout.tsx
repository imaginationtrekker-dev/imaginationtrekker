import type { Metadata } from "next";
import "./globals.css";
import "./shared.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "./components/SessionProvider";
import BackToTop from "./components/BackToTop";

export const metadata: Metadata = {
  title: "Imagination Trekker - Adventure Awaits",
  description: "Step into a world of unforgettable adventures with Imagination Trekker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <SessionProvider>
          {children}
          <BackToTop />
          <Toaster position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
