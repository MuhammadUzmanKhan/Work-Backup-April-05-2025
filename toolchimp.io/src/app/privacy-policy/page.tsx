"use client";
import useIsMobile from "@/app/hooks/MobileOnly";
import React from "react";

export default function PrivacyPolicy() {
  const isMobile = useIsMobile();

  return (
    <div
      className="flex flex-col items-center justify-start pt-5 min-h-screen gap-3"
      style={{ backgroundColor: "#212121", color: "#FFFFFF" }}
    >
      <h1 className="text-4xl md:text-6xl font-bold mb-5 text-center">
        Privacy Policy
      </h1>

      <div
        className={`${
          isMobile ? "px-7 text-left" : "px-5"
        } md:px-20 lg:px-40 text-left space-y-4`}
      >
        <p>
          ToolChimp operates the ToolChimp website, providing various tools and
          services free of charge.
        </p>

        <p>
          This page informs you of our policies regarding the collection, use,
          and disclosure of personal data when you use our Service.
        </p>

        <p>
          By using our Service, you agree to the collection and use of
          information in accordance with this policy.
        </p>

        <h2 className="text-2xl font-semibold">
          Information Collection and Use
        </h2>

        <p>
          We collect several different types of information for various purposes
          to provide and improve our Service.
        </p>

        <h2 className="text-2xl font-semibold">Log Data</h2>

        <p>
          When you access the Service, we may collect information that your
          browser sends whenever you visit our website (&quot;Log Data&quot;).
          This Log Data may include information such as your computer&apos;s
          Internet Protocol (&quot;IP&quot;) address, browser version, pages of
          our Service that you visit, the time and date of your visit, the time
          spent on those pages, and other statistics.
        </p>

        <h2 className="text-2xl font-semibold">Cookies</h2>

        <p>
          We use cookies to collect information and improve our Service. You
          have the option to accept or refuse these cookies and know when a
          cookie is being sent to your computer. If you choose to refuse our
          cookies, you may not be able to use some portions of our Service.
        </p>

        <h2 className="text-2xl font-semibold">Service Providers</h2>

        <p>
          We may employ third-party companies and individuals to facilitate our
          Service, to provide the Service on our behalf, to perform
          Service-related services, or to assist us in analyzing how our Service
          is used. These third parties have access to your Personal Information
          only to perform these tasks on our behalf and are obligated not to
          disclose or use it for any other purpose.
        </p>

        <h2 className="text-2xl font-semibold">Security</h2>

        <p>
          We value your trust in providing us your Personal Information, and we
          are striving to use commercially acceptable means of protecting it.
          However, remember that no method of transmission over the internet, or
          method of electronic storage is 100% secure and reliable, and we
          cannot guarantee its absolute security.
        </p>

        <h2 className="text-2xl font-semibold">Links to Other Sites</h2>

        <p>
          Our Service may contain links to other sites. If you click on a
          third-party link, you will be directed to that site. Note that these
          external sites are not operated by us. Therefore, we strongly advise
          you to review the Privacy Policy of these websites. We have no control
          over, and assume no responsibility for the content, privacy policies,
          or practices of any third-party sites or services.
        </p>

        <h2 className="text-2xl font-semibold">Children&apos;s Privacy</h2>

        <p>
          Our Service does not address anyone under the age of 13
          (&quot;Children&quot;). We do not knowingly collect personally
          identifiable information from children under 13. If you are a parent
          or guardian and you are aware that your child has provided us with
          Personal Information, please contact us. If we discover that a child
          under 13 has provided us with Personal Information, we will delete
          such information from our servers immediately.
        </p>

        <h2 className="text-2xl font-semibold">
          Changes to This Privacy Policy
        </h2>

        <p>
          We may update our Privacy Policy from time to time. We will notify you
          of any changes by posting the new Privacy Policy on this page. You are
          advised to review this Privacy Policy periodically for any changes.
          Changes to this Privacy Policy are effective when they are posted on
          this page.
        </p>

        <h2 className="text-2xl font-semibold">Contact Us</h2>

        <p>
          If you have any questions about this Privacy Policy, please contact
          us.
        </p>
      </div>
    </div>
  );
}
