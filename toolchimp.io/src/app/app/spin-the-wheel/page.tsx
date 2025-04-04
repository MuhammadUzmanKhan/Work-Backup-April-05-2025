import { Metadata } from "next";
import Spinner from "./spin-the-wheel";
import { APP_NAME, CDN_URL, DOMAIN, SEO } from "@/app/constants";

export const metadata: Metadata = {
  title: `Spin the wheel`,
  description:
    "Use the Spin the wheel on Toolchimp.io to choose from multiple options easily. Perfect for decision making, games, and more!",
  keywords: `${SEO.keywords}, Spin the wheel, word Spin the wheel, multi spin, multi option, spin the wheel, decision making tool, random selector`,
  openGraph: {
    title: "Spin the wheel",
    siteName: `Spin the wheel - ${APP_NAME}`,
    description:
      "Use the Spin the wheel on Toolchimp.io to choose from multiple options easily. Perfect for decision making, games, and more!",
    url: `${DOMAIN}/app/spin-the-wheel`,
    type: "website",
    images: [
      {
        url: `${CDN_URL}/img/spin-the-wheel.png`,
        width: 800,
        height: 600,
        alt: "Spin the wheel on Toolchimp.io",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@toolchimp_io",
    title: `Spin the wheel`,
    description:
      "Use the Spin the wheel on Toolchimp.io to choose from multiple options easily. Perfect for decision making, games, and more!",
    images: `${CDN_URL}/img/spin-the-wheel.png`,
  },
};

export default Spinner;
