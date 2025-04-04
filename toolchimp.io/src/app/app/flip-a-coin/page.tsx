import { Metadata } from "next";
import CoinFlip from "./flip-a-coin";
import { APP_NAME, CDN_URL, DOMAIN } from "@/app/constants";

export const metadata: Metadata = {
  title: `Flip a Coin`,
  description:
    "Flip a virtual coin online with our easy-to-use coin toss simulator. Perfect for making quick decisions, playing games, or just for fun!",
  keywords: `flip a coin, coin toss, virtual coin flip, online coin toss, coin flip simulator, heads or tails, toolchimp, ${APP_NAME}`,
  openGraph: {
    title: "Flip a Coin",
    siteName: `Flip a Coin - ${APP_NAME}`,
    description:
      "Flip a virtual coin online with our easy-to-use coin toss simulator. Perfect for making quick decisions, playing games, or just for fun!",
    url: `${DOMAIN}/app/flip-a-coin`,
    type: "website",
    images: [
      {
        url: `${CDN_URL}/img/flip-a-coin.png`,
        width: 800,
        height: 600,
        alt: "Flip a Coin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@toolchimp_io",
    title: `Flip a Coin`,
    description:
      "Flip a virtual coin online with our easy-to-use coin toss simulator. Perfect for making quick decisions, playing games, or just for fun!",
    images: `${CDN_URL}/img/flip-a-coin.png`,
  },
};

export default CoinFlip;
