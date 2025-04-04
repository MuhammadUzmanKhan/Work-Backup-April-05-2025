import { Metadata } from "next";
import CrowdStrike from "./how-to-fix-windows-11-crowdstrike-error";
import { APP_NAME, CDN_URL, DOMAIN, SEO } from "@/app/constants";

export const metadata: Metadata = {
  title: `Fix Windows CrowdStrike Issue - ${APP_NAME}`,
  description:
    "Learn how to fix the Windows CrowdStrike issue causing BSOD errors. Follow our step-by-step guide to resolve this problem and get your system running smoothly.",
  keywords: `${SEO.keywords}, Fix Windows CrowdStrike issue, CrowdStrike BSOD error, CrowdStrike fix, Windows error resolution, CrowdStrike problem solution`,
  openGraph: {
    title: "Fix Windows CrowdStrike Issue",
    siteName: `Fix Windows CrowdStrike Issue - ${APP_NAME}`,
    description:
      "Learn how to fix the Windows CrowdStrike issue causing BSOD errors. Follow our step-by-step guide to resolve this problem and get your system running smoothly.",
    url: `${DOMAIN}/blog/how-to-fix-windows-11-crowdstrike-error`,
    type: "website",
    images: [
      {
        url: `${CDN_URL}/img/CrowdStrike-BSOD-Error-Microsoft-1024x576.jpeg`,
        width: 800,
        height: 600,
        alt: "Fix Windows CrowdStrike Error",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@toolchimp_io",
    title: `Fix Windows CrowdStrike Issue - ${APP_NAME}`,
    description:
      "Learn how to fix the Windows CrowdStrike issue causing BSOD errors. Follow our step-by-step guide to resolve this problem and get your system running smoothly.",
    images: `${CDN_URL}/img/CrowdStrike-BSOD-Error-Microsoft-1024x576.jpeg`,
  },
};

export default CrowdStrike;
