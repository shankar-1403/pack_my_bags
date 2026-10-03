import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How PackMyBags collects, uses, shares and protects your personal data, and the rights you have over it.",
};

const UPDATED = "3 October 2026";

export default async function PrivacyPage() {
  const s = await getSettings();
  const phone = s.phone;
  const tel = `tel:${s.phone.replace(/\s/g, "")}`;
  const mail = `mailto:${s.email}`;

  const sections: LegalSection[] = [
    {
      id: "who-we-are",
      title: "Who we are",
      body: (
        <>
          <p>
            PackMyBags (“<strong>PackMyBags</strong>”, “<strong>we</strong>”, “<strong>us</strong>”) is a travel brand and division of <strong>PCRED Venture Pvt. Ltd.</strong>, based in Mumbai, India, that plans and arranges domestic and international trips. We decide why and how your personal data is used, which makes us the Data Fiduciary for the purposes of the Digital Personal Data Protection Act, 2023.
          </p>
          <p>
            Our studio: {s.address} You can reach us at <a href={mail}>{s.email}</a> or <a href={tel}>{phone}</a>.
          </p>
          <p>
            This policy covers this website, enquiries you send us by form, phone, email or WhatsApp, and the trips we arrange for you. It is written to follow the Digital Personal Data Protection Act, 2023, the Information Technology Act, 2000 and the rules made under them.
          </p>
        </>
      ),
    },
    {
      id: "what-we-collect",
      title: "What we collect",
      body: (
        <>
          <p><strong>When you send an enquiry.</strong> Your name, email address, phone number, your message, and the trip or departure date you are asking about.</p>
          <p><strong>When you book or travel with us.</strong> Only what is needed to arrange your trip, which may include:</p>
          <ul>
            <li>names of all travellers as they appear on their ID or passport, age or date of birth, and gender where an airline, hotel or authority asks for it;</li>
            <li>government ID or passport details, and documents needed for visas or permits;</li>
            <li>an emergency contact;</li>
            <li>dietary needs, and health or fitness information you choose to share so that we can keep you safe on the trip;</li>
            <li>payment and invoice records (we do not collect card or bank details on this website).</li>
          </ul>
          <p><strong>When you talk to us.</strong> The content of calls, emails and WhatsApp messages you exchange with our team.</p>
          <p><strong>When you use this website.</strong> Our hosting provider keeps standard server logs, such as IP address, browser type, the page requested and the time, to keep the site secure and working. We do not use analytics, advertising or tracking tools on this website.</p>
          <p><strong>On the trip.</strong> Our trip captains may take group photos and videos (see section 3).</p>
        </>
      ),
    },
    {
      id: "how-we-use-it",
      title: "How we use your data",
      body: (
        <>
          <p>We use personal data only for these purposes:</p>
          <ul>
            <li>to reply to your enquiry and send you a plan or quote;</li>
            <li>to book and manage your trip, including flights, stays, transport, permits, visas, cruises and insurance;</li>
            <li>to stay in touch before, during and after your trip, including changes to your itinerary;</li>
            <li>to look after your safety and respond to emergencies;</li>
            <li>to take payments, issue invoices and meet our tax, accounting and other legal obligations;</li>
            <li>to send you news about upcoming departures, only if you have agreed to it. You can stop these at any time;</li>
            <li>to share trip photos on our website and social media. Tell us if you would rather not appear and we will not use, or will remove, photos of you.</li>
          </ul>
          <p>We do not sell your personal data, and we do not use it for automated decisions about you.</p>
        </>
      ),
    },
    {
      id: "consent",
      title: "Consent and your choices",
      body: (
        <>
          <p>
            By sending us an enquiry or sharing documents for a booking, you consent to us using that data for the purposes above. Some uses are also allowed without separate consent under the law, such as doing what you have asked us to do, meeting legal obligations, and responding to a medical emergency.
          </p>
          <p>
            You may withdraw your consent at any time by writing to <a href={mail}>{s.email}</a>. Withdrawing consent does not affect what we did before, but it may mean we cannot complete or continue a booking, because suppliers and authorities need certain details.
          </p>
        </>
      ),
    },
    {
      id: "sharing",
      title: "Who we share it with",
      body: (
        <>
          <p>We share personal data only as far as needed to arrange your trip or run our business:</p>
          <ul>
            <li><strong>Travel suppliers:</strong> airlines, hotels and homestays, transport operators, cruise lines, local guides and activity providers;</li>
            <li><strong>Visa and permit authorities:</strong> embassies, consulates, visa application centres and government offices, and visa agents we work with;</li>
            <li><strong>Insurers,</strong> when you buy travel insurance through us or need to make a claim;</li>
            <li><strong>Service providers that run our website and communications:</strong> Google Firebase (website hosting, database and file storage), our email provider, and WhatsApp (Meta) when you choose to message us there;</li>
            <li><strong>Banks and payment partners,</strong> to process payments and refunds;</li>
            <li><strong>Professional advisers</strong> such as accountants and lawyers;</li>
            <li><strong>Government and law enforcement,</strong> when the law requires it.</li>
          </ul>
          <p>
            <strong>Data outside India.</strong> Our website database is hosted by Google in Singapore, and international trips require sharing details with suppliers and authorities in the countries you visit. These parties handle your data under their own laws and policies. We only transfer data outside India as permitted by Indian law.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies and third-party content",
      body: (
        <>
          <p>
            We do not use advertising or analytics cookies. The only cookie we set is a strictly necessary one used when our own staff sign in to manage the website. Visitors do not receive it.
          </p>
          <p>
            Some images on this website load from image services such as Unsplash and Google Cloud Storage, which may receive your IP address when the image loads. Links to Google Maps, WhatsApp and other services take you to sites with their own privacy policies.
          </p>
        </>
      ),
    },
    {
      id: "retention",
      title: "How long we keep it",
      body: (
        <>
          <ul>
            <li><strong>Enquiries</strong> are kept for as long as we need to reply and follow up, and are then deleted unless they lead to a booking.</li>
            <li><strong>Booking and payment records</strong> are kept for as long as Indian tax, accounting and other laws require.</li>
            <li><strong>Identity and visa documents</strong> are kept only for as long as needed for your trip, unless the law requires us to keep them longer.</li>
          </ul>
          <p>When data is no longer needed, we delete it or make it anonymous.</p>
        </>
      ),
    },
    {
      id: "security",
      title: "How we protect it",
      body: (
        <>
          <p>
            We follow reasonable security practices: the website uses encrypted connections (HTTPS), our database cannot be read from the public internet, access is limited to staff who need it and requires a sign-in, and we choose service providers with strong security.
          </p>
          <p>
            No system is completely secure. If a personal data breach affects you, we will inform you and the Data Protection Board of India as the law requires.
          </p>
        </>
      ),
    },
    {
      id: "your-rights",
      title: "Your rights",
      body: (
        <>
          <p>Under the Digital Personal Data Protection Act, 2023, you can ask us to:</p>
          <ul>
            <li>tell you what personal data we hold about you and how we use it, and who we have shared it with;</li>
            <li>correct, complete or update your data;</li>
            <li>erase your data, unless we must keep it by law or to complete your booking;</li>
            <li>stop using data you consented to, by withdrawing consent;</li>
            <li>resolve a complaint about how we have handled your data;</li>
            <li>act for you through a person you nominate, in the event of death or incapacity.</li>
          </ul>
          <p>
            Write to <a href={mail}>{s.email}</a> with your request. We may need to confirm your identity first. If you are not satisfied with our response, you may complain to the Data Protection Board of India.
          </p>
        </>
      ),
    },
    {
      id: "children",
      title: "Children",
      body: (
        <p>
          This website is not meant for children. We collect personal data of anyone under 18 only from their parent or lawful guardian, with that person’s consent, and only to arrange travel for the child with their family or group.
        </p>
      ),
    },
    {
      id: "grievance",
      title: "Grievance Officer",
      body: (
        <>
          <p>For any question, request or complaint about your personal data, contact our Grievance Officer:</p>
          <p>
            <strong>Grievance Officer, PackMyBags</strong>
            <br />
            {s.address}
            <br />
            Email: <a href={mail}>{s.email}</a>
            <br />
            Phone: <a href={tel}>{phone}</a>
          </p>
          <p>We will acknowledge your complaint within 48 hours and aim to resolve it within one month.</p>
        </>
      ),
    },
    {
      id: "changes",
      title: "Changes to this policy",
      body: (
        <p>
          We may update this policy when our services or the law change. The date at the top shows the latest version. If a change significantly affects how we use your data, we will tell you before it applies. Please also read our <Link href="/terms">Terms &amp; Conditions</Link>.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated={UPDATED}
      intro={<p>We collect only what we need to plan your trip, we never sell it, and you can ask us what we hold about you at any time. The details are below.</p>}
      sections={sections}
      related={{ href: "/terms", label: "Terms & Conditions" }}
    />
  );
}
