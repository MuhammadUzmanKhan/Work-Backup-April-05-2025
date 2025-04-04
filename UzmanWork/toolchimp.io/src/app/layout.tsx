import { Toaster } from "react-hot-toast";
import { GoogleTagManager } from '@next/third-parties/google'
import Header from "@/app/components/Navigations/Header";
import Footer from "@/app/components/Navigations/Footer";
import "./globals.css";

import { Metadata } from "next";
import { APP_NAME, DOMAIN, SEO } from "./constants";

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: `${APP_NAME}`,
  },
  description:
    "Toolchimp.io offers a wide range of online tools, including a coin flip simulator, spinner, YouTube video downloader, Facebook video downloader, and many more!",
  metadataBase: new URL("https://toolchimp.io"),
  keywords: SEO.keywords,
  openGraph: {
    title: "Toolchimp.io - Your One Stop Solution for Online Tools",
    siteName: "toolchimp.io",
    description:
      "Discover a wide range of online tools on Toolchimp.io. Flip a coin, use a spinner, download YouTube and Facebook videos, and much more!",
    url: "https://toolchimp.io",
    type: "website",
    images: [
      {
        url: `${DOMAIN}/img/logo-colored.png`,
        width: 800,
        height: 600,
        alt: "Toolchimp.io Online Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@toolchimp_io",
    title: "Toolchimp.io - Your One Stop Solution for Online Tools",
    description:
      "Discover a wide range of online tools on Toolchimp.io. Flip a coin, use a spinner, download YouTube and Facebook videos, and much more!",
    images: `${DOMAIN}/img/logo-colored.png`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-8687146155436610" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" type="image/x-icon" href="/icon.ico" sizes="any" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8687146155436610"
          crossOrigin="anonymous"
        ></script>
				<GoogleTagManager gtmId="G-WFG78F8Y6J" />
      </head>
      <body>
        <Toaster position="bottom-center" />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
