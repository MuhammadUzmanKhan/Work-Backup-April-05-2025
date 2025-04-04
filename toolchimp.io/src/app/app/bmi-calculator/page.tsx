import { Metadata } from "next";
import BMICalculator from "./bmi-calculator";
import { APP_NAME, CDN_URL, DOMAIN } from "@/app/constants";

export const metadata: Metadata = {
  title: `BMI Calculator`,
  description:
    "Use our online BMI Calculator to quickly determine your Body Mass Index. Perfect for tracking your health and fitness goals!",
  keywords: `BMI calculator, body mass index, health tools, fitness tools, online BMI calculator, ${APP_NAME}, toolchimp`,
  openGraph: {
    title: "BMI Calculator",
    siteName: `BMI Calculator`,
    description:
      "Use our online BMI Calculator to quickly determine your Body Mass Index. Perfect for tracking your health and fitness goals!",
    url: `${DOMAIN}/app/bmi-calculator`,
    type: "website",
    images: [
      {
        url: `${CDN_URL}/img/bmi-calculator.png`,
        width: 800,
        height: 600,
        alt: "BMI Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@toolchimp_io",
    title: "BMI Calculator",
    description:
      "Use our online BMI Calculator to quickly determine your Body Mass Index. Perfect for tracking your health and fitness goals!",
    images: `${CDN_URL}/img/bmi-calculator.png`,
  },
};

export default BMICalculator;
