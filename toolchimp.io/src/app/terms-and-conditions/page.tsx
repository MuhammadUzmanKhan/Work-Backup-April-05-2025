"use client";
import useIsMobile from "@/app/hooks/MobileOnly";
import React from "react";

export default function TermsAndConditions() {
  const isMobile = useIsMobile();

  return (
    <div
      className="flex flex-col items-center justify-start pt-5 min-h-screen gap-3"
      style={{ backgroundColor: "#212121", color: "#FFFFFF" }}
    >
      <h1 className="text-4xl md:text-6xl font-bold mb-5 text-center">
        Terms and Conditions
      </h1>
      <div
        className={`${
          isMobile ? "px-7 text-left" : "px-5"
        } md:px-20 lg:px-40 text-left space-y-4`}
      >
        <h2 className="text-2xl font-semibold">1. Introduction</h2>
        <p>
          Welcome to ToolChimp! These terms and conditions outline the rules and
          regulations for the use of ToolChimp&apos;s Website.
        </p>
        <h2 className="text-2xl font-semibold">
          2. Intellectual Property Rights
        </h2>
        <p>
          Other than the content you own, under these Terms, ToolChimp and/or
          its licensors own all the intellectual property rights and materials
          contained in this Website.
        </p>
        <h2 className="text-2xl font-semibold">3. Restrictions</h2>
        <p>You are specifically restricted from all of the following:</p>
        <ul className="list-disc list-inside">
          <li>Publishing any Website material in any other media</li>
          <li>
            Selling, sublicensing and/or otherwise commercializing any Website
            material;
          </li>
          <li>Publicly performing and/or showing any Website material</li>
          <li>
            Using this Website in any way that is or may be damaging to this
            Website;
          </li>
          <li>
            Using this Website in any way that impacts user access to this
            Website
          </li>
          <li>
            Using this Website contrary to applicable laws and regulations, or
            in any way may cause harm to the Website, or to any person or
            business entity
          </li>
          <li>
            Engaging in any data mining, data harvesting, data extracting or any
            other similar activity in relation to this Website
          </li>
          <li>Using this Website to engage in any advertising or marketing.</li>
        </ul>
        <h2 className="text-2xl font-semibold">4. Your Content</h2>
        <p>
          In these Website Standard Terms and Conditions, “Your Content” shall
          mean any audio, video text, images or other material you choose to
          display on this Website. By displaying Your Content, you grant
          ToolChimp a non-exclusive, worldwide irrevocable, sub-licensable
          license to use, reproduce, adapt, publish, translate and distribute it
          in any and all media.
        </p>
        <h2 className="text-2xl font-semibold">5. Limitation of Liability</h2>
        <p>
          In no event shall ToolChimp, nor any of its officers, directors and
          employees, be held liable for anything arising out of or in any way
          connected with your use of this Website whether such liability is
          under contract. ToolChimp, including its officers, directors and
          employees shall not be held liable for any indirect, consequential or
          special liability arising out of or in any way related to your use of
          this Website.
        </p>
        <h2 className="text-2xl font-semibold">6. Indemnification</h2>
        <p>
          You hereby indemnify to the fullest extent ToolChimp from and against
          any and/or all liabilities, costs, demands, causes of action, damages
          and expenses arising in any way related to your breach of any of the
          provisions of these Terms.
        </p>
        <h2 className="text-2xl font-semibold">7. Severability</h2>
        <p>
          If any provision of these Terms is found to be invalid under any
          applicable law, such provisions shall be deleted without affecting the
          remaining provisions herein.
        </p>
        <h2 className="text-2xl font-semibold">8. Variation of Terms</h2>
        <p>
          ToolChimp is permitted to revise these Terms at any time as it sees
          fit, and by using this Website you are expected to review these Terms
          on a regular basis.
        </p>
        <h2 className="text-2xl font-semibold">9. Assignment</h2>
        <p>
          ToolChimp is allowed to assign, transfer, and subcontract its rights
          and/or obligations under these Terms without any notification.
          However, you are not allowed to assign, transfer, or subcontract any
          of your rights and/or obligations under these Terms.
        </p>
        <h2 className="text-2xl font-semibold">10. Entire Agreement</h2>
        <p>
          These Terms constitute the entire agreement between ToolChimp and you
          in relation to your use of this Website, and supersede all prior
          agreements and understandings.
        </p>
        <h2 className="text-2xl font-semibold">
          11. Governing Law & Jurisdiction
        </h2>
        <p>
          These Terms will be governed by and interpreted in accordance with the
          laws of Pakistan, and you submit to the non-exclusive jurisdiction of
          the state and federal courts located in Pakistan for the resolution of
          any disputes.
        </p>
      </div>
    </div>
  );
}
