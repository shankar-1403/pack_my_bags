import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms for using the PackMyBags website and booking trips with PackMyBags.",
};

const UPDATED = "3 October 2026";

export default async function TermsPage() {
  const s = await getSettings();
  const tel = `tel:${s.phone.replace(/\s/g, "")}`;
  const mail = `mailto:${s.email}`;

  const sections: LegalSection[] = [
    {
      id: "about",
      title: "About these terms",
      body: (
        <>
          <p>
            These terms apply when you use this website or book a trip or travel service with PackMyBags (“<strong>PackMyBags</strong>”, “<strong>we</strong>”, “<strong>us</strong>”), a travel brand and division of <strong>PCRED Venture Pvt. Ltd.</strong>, based at {s.address}
          </p>
          <p>
            By using the website or confirming a booking, you agree to these terms. If you book for other travellers, you confirm that you are allowed to accept these terms on their behalf and that you will share them with everyone in your booking.
          </p>
        </>
      ),
    },
    {
      id: "services",
      title: "What we do",
      body: (
        <>
          <p>
            We plan and arrange domestic and international travel: fixed-date group departures, private and custom trips, holiday packages, flights, hotels, cruises and visa assistance.
          </p>
          <p>
            For our own group departures we organise the trip. For services run by others, such as airlines, hotels, cruise lines and transport operators, we book them on your behalf, and those providers’ own terms also apply (see section 11).
          </p>
        </>
      ),
    },
    {
      id: "website-information",
      title: "Information on the website",
      body: (
        <p>
          We work to keep trip details, prices, dates and itineraries accurate, but they can change and occasionally contain errors. Photos show the kind of places you will visit and are not a promise of exact views, rooms or weather. The details in your written booking confirmation take priority over the website.
        </p>
      ),
    },
    {
      id: "booking",
      title: "Enquiries and bookings",
      body: (
        <>
          <ul>
            <li>Sending an enquiry does not reserve a place or create a booking.</li>
            <li>A booking is confirmed only when we confirm it to you in writing (by email or WhatsApp) <strong>and</strong> we have received the advance payment stated for that trip.</li>
            <li>Places on group departures are limited and are confirmed in the order advances are received.</li>
            <li>Please give us traveller names exactly as they appear on ID or passports. Charges caused by incorrect details are payable by you.</li>
            <li>Check your confirmation carefully and tell us straight away if anything is wrong.</li>
          </ul>
        </>
      ),
    },
    {
      id: "prices",
      title: "Prices and payment",
      body: (
        <>
          <ul>
            <li>Prices are per person in Indian Rupees and are based on twin sharing unless the trip says otherwise. A single room costs extra where a single supplement is listed.</li>
            <li>What is included and not included is listed on each trip page and in your quote, and forms part of your booking.</li>
            <li>Applicable taxes, including GST and, for international packages, Tax Collected at Source (TCS), are charged as required by law and shown in your quote.</li>
            <li>The balance is due by the date given in your booking confirmation. If it is not paid on time, we may treat the booking as cancelled by you (see section 6).</li>
            <li>Prices can change before full payment because of supplier rates, taxes, fuel surcharges or exchange rates. If the price of your confirmed booking changes significantly, we will tell you and you may cancel under section 6.</li>
          </ul>
        </>
      ),
    },
    {
      id: "cancellation-by-you",
      title: "If you cancel",
      body: (
        <>
          <ul>
            <li>Cancellations must be sent to us in writing by email or WhatsApp. The date we receive your message is the cancellation date.</li>
            <li>Cancellation charges follow the cancellation policy shown on the trip page and in your booking confirmation.</li>
            <li>Where no policy is stated, we charge the costs we have already paid or cannot recover from suppliers, such as non-refundable flights, hotel deposits and visa fees.</li>
            <li>Refunds are paid to the original payment method once we have received any amounts due back from suppliers.</li>
            <li>You may transfer your place to someone else where suppliers allow it. Any name-change charges are payable by you.</li>
          </ul>
        </>
      ),
    },
    {
      id: "changes-by-us",
      title: "Changes and cancellations by us",
      body: (
        <>
          <ul>
            <li>
              Itineraries may change because of weather, road or airport closures, permit rules, safety concerns or other local conditions. Your trip captain may change the plan on the day to keep the group safe. We will always aim to offer an alternative of similar standard.
            </li>
            <li>
              Group departures need a minimum number of travellers. If we cancel a departure for this or any other reason within our control, you may choose another date or receive a full refund of the money you paid us.
            </li>
            <li>
              We are not responsible for costs you arranged separately, such as flights, trains or leave from work. We recommend booking flexible tickets until your trip is confirmed.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "force-majeure",
      title: "Events outside our control",
      body: (
        <p>
          We are not responsible for failing to provide or changing any service because of events beyond our reasonable control, including natural disasters, extreme weather, epidemics, war or unrest, strikes, government orders, and closures of roads, borders or airports. In such cases we will help you as much as we can, and refund what we are able to recover from suppliers, less costs already incurred.
        </p>
      ),
    },
    {
      id: "documents-health",
      title: "Travel documents, visas and health",
      body: (
        <>
          <ul>
            <li>You are responsible for carrying valid ID and, for international travel, a passport that meets the destination’s rules (many countries require at least six months’ validity).</li>
            <li>We help with visa applications, but the decision rests entirely with the embassy or authority. Visa fees are not refundable, and we are not responsible if a visa is refused or delayed.</li>
            <li>You are responsible for any vaccinations or health requirements of the places you visit.</li>
            <li>Some trips involve trekking, high altitude or long road journeys. Tell us about any medical condition before booking and make sure you are fit for the trip you choose.</li>
            <li>We strongly recommend travel insurance covering medical care, evacuation and cancellation. Some trips require it.</li>
          </ul>
        </>
      ),
    },
    {
      id: "on-the-trip",
      title: "On the trip",
      body: (
        <>
          <ul>
            <li>Please follow the reasonable instructions of your trip captain, guides and suppliers, particularly on safety.</li>
            <li>Respect fellow travellers, local communities and local laws. Harassment, illegal drugs or behaviour that puts the group at risk may lead to removal from the trip without a refund, and you will pay any resulting costs.</li>
            <li>Rooms are shared on a twin basis as described on the trip page. Single rooms are available where a single supplement is listed.</li>
            <li>You are responsible for your own belongings, money and documents.</li>
          </ul>
        </>
      ),
    },
    {
      id: "suppliers",
      title: "Third-party suppliers",
      body: (
        <p>
          Flights, hotels, cruises, transport and activities are often provided by independent companies under their own terms and conditions, which may limit what they are liable for. We choose suppliers carefully, but we are not responsible for their acts, omissions or schedule changes, beyond our duty to select them with reasonable care and to help you if something goes wrong.
        </p>
      ),
    },
    {
      id: "liability",
      title: "Our liability",
      body: (
        <p>
          To the extent permitted by law, our total liability to you for any booking is limited to the amount you paid us for that booking, and we are not liable for indirect or consequential losses. Nothing in these terms limits any liability that cannot be limited under Indian law, including for death or personal injury caused by our negligence.
        </p>
      ),
    },
    {
      id: "photos-content",
      title: "Photos and website content",
      body: (
        <>
          <p>
            Our trip captains may take group photos and videos and we may use them on our website and social media. If you would rather not appear, tell your captain or write to us and we will not use, or will remove, images of you.
          </p>
          <p>
            The text, photographs, logo and design of this website belong to PackMyBags or the people who licensed them to us. Please do not copy or reuse them without our written permission.
          </p>
        </>
      ),
    },
    {
      id: "website-use",
      title: "Using this website",
      body: (
        <p>
          Please use this website lawfully. Do not attempt to gain unauthorised access to it, interfere with how it works, copy its content in bulk, or send false or misleading enquiries. Links to other websites are provided for convenience; we are not responsible for their content.
        </p>
      ),
    },
    {
      id: "privacy",
      title: "Your personal data",
      body: (
        <p>
          How we collect and use your personal data is explained in our <Link href="/privacy">Privacy Policy</Link>, which forms part of these terms.
        </p>
      ),
    },
    {
      id: "complaints",
      title: "Questions and complaints",
      body: (
        <>
          <p>
            If something is not right during your trip, tell your trip captain straight away so we can try to fix it on the spot. For anything else, or after your trip, contact our Grievance Officer:
          </p>
          <p>
            <strong>Grievance Officer, PackMyBags</strong>
            <br />
            {s.address}
            <br />
            Email: <a href={mail}>{s.email}</a>
            <br />
            Phone: <a href={tel}>{s.phone}</a>
          </p>
          <p>We will acknowledge your complaint within 48 hours and aim to resolve it within one month.</p>
        </>
      ),
    },
    {
      id: "law",
      title: "Governing law",
      body: (
        <p>
          These terms are governed by the laws of India. Any dispute will be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra. This does not affect any right you have to approach a consumer commission under the Consumer Protection Act, 2019.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Changes to these terms",
      body: (
        <p>
          We may update these terms from time to time. The date at the top shows the latest version. Your booking is governed by the terms in force on the date it was confirmed.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      updated={UPDATED}
      intro={<p>Plain terms for planning, booking and travelling with PackMyBags. Please read them before you confirm a trip.</p>}
      sections={sections}
      related={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
