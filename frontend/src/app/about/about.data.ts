/** Copy and media for the About (Our Story) page — typography: headings 600, body 400; colors from theme. */

import { AboutGearsPhotoSrc, AboutHeroBannerSrc } from "../../../images";

export const aboutPageData = {
  hero: {
    title: "Our Story, Vision, And Values",
    subtitle: "Discover The Principles And Ideas That Shape Everything We Do.",
    imageSrc: AboutHeroBannerSrc,
    imageAlt: "Hand holding a light bulb — ideas and vision for Mollure.",
  },
  split: {
    imageSrc: AboutGearsPhotoSrc,
    imageAlt:
      "Two hands meshing silver and gold gears over salon tools — precision and care.",
    panelTitle: "About Us",
    /** Client About (`/about`) */
    clientParagraphs: [
      "Most booking platforms focus on automation and speed, but often overlook something essential: real conversation. In beauty and grooming, people want clarity before committing. They have questions about treatments, preferences, locations, or what will work best for them.",
      "Mollure is built around interaction, not just instant confirmations. You can message professionals directly, ask questions, discuss details, and request changes within the booking itself. Every conversation stays connected and clear.",
      "Whether you visit a professional or invite them to your location, each booking is transparent and easy to manage, giving you the clarity and control you expect.",
    ],
    /** Professional About (`/professionals/about`) */
    professionalParagraphs: [
      "Running a professional service is about more than filling your calendar. It's about focus, relationships, and having control over how you work.",
      "Mollure was built after seeing how much time professionals lose to scattered communication, interruptions, and repeated questions across different tools.",
      "We created a calmer workflow where bookings, clients, payments, and communication live in one place.",
      "Clients can ask questions, confirm details, and request changes directly through messages linked to their booking, and you respond when it suits you, without disrupting your work.",
      "Instead of adding complexity, we focus on the essentials: business setup, bookings, client management, payments, and communication, so professionals can stay in control of their clients, pricing, and schedule.",
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    /** Client About (`/about`) only — questions provided for the client end */
    clientItems: [
      {
        id: "professionals-verified",
        question: "Are Professionals On Mollure Verified?",
        answer:
          "Yes. All Professionals On Mollure Operate As Registered Businesses. Before Appearing On The Platform, Their Business Details Are Reviewed To Ensure They Are Legitimate And Professionally Active. Mollure Does Not Perform Background Checks, But We Focus On Transparency So You Know You're Booking With A Verified Professional Business.",
      },
      {
        id: "questions-before-booking",
        question: "How Does Booking Work If I Have Questions Before Booking?",
        answer:
          "If You Have Questions Before Confirming A Booking, You Can Message The Professional Directly. This Is Useful If You're Unsure Which Service To Choose, Want To Explain Your Situation, Or Need Clarification Before Committing. Once A Booking Is Created, All Communication Stays Linked To That Booking So Both You And The Professional Have The Full Context In One Place.",
      },
      {
        id: "bookings-always-instant",
        question: "Are Bookings Always Instant?",
        answer:
          "No, And That's Intentional. When You Create A Booking For A Fixed Location Service, It Is Usually Confirmed Instantly. For Desired Location Services, Bookings Are Always Sent As A Booking Request. This Is Because There Are More Variables Involved, Such As Travel, Timing, And Setup. Booking Requests Allow Both You And The Professional To Review The Details, Suggest Changes If Needed, And Confirm Everything With Clarity Before The Booking Is Finalized.",
      },
      {
        id: "booking-doesnt-fit-standard",
        question: "What If My Booking Doesn't Fit The Standard Setup?",
        answer:
          "If Your Booking Doesn't Fit The Standard Options, You Can Simply Message The Professional. This Can Be Helpful If You Need A Different Setup, More Guests, Or A Custom Arrangement. Professionals Can Create And Send You A Custom Booking Request For You To Review And Confirm, So You're Never Limited By Predefined Booking Options.",
      },
      {
        id: "payments-and-invoices",
        question: "How Do Payments And Invoices Work?",
        answer:
          "Payment Options Depend On What The Professional Offers And May Include Online Or Offline Payments. All Online Payments Are Securely Processed Through Stripe. Invoices And Receipts Are Automatically Generated In PDF Format. Anyone Who Pays Online — Including Clients Or Guests — Will Receive An Invoice And Receipt By Email. Registered Users Can Also Access These Documents Through Their Account, Linked To The Relevant Booking. Company Clients Always Receive Tax-Compliant Invoices, Regardless Of Whether Payment Is Made Online Or Offline.",
      },
      {
        id: "types-of-clients",
        question: "What Types Of Clients Can Use Mollure?",
        answer:
          "Mollure Is Designed For Both Individual And Company Clients. Individual Clients Can Book Professionals For Personal Services, Either At A Fixed Location Or At Their Own Desired Location, Depending On What The Professional Offers. Company Clients Can Also Use Mollure. When A Professional Offers Project Bookings, Businesses Can Book Services For Events, Productions, Or Other Professional Needs. These Bookings Support Planning Details And Include Tax-Compliant Invoicing, Making It Easier To Work Directly With Professionals.",
      },
    ],
    /** Professional About (`/professionals/about`) only */
    professionalItems: [
      {
        id: "fees",
        question: "What Fees Do I Pay On Mollure?",
        answer:
          "Mollure Charges A Small Monthly Subscription And A Stripe Fee Plus 1% Mollure Fee On Online Transactions, In Addition To The Standard Stripe Processing Fee. There Are No Hidden Costs Or Payout Delays, All Payments Go Directly To Your Stripe Account.",
      },
      {
        id: "create-booking-for-client",
        question: "Is It Possible To Create A Booking For A Client?",
        answer:
          "Yes. As A Professional, You Can Create And Send A Booking Request (BR) Directly To A Mollure Client. Once Received, The Client Can Either Accept The Request, Suggest Changes By Sending A Message, Or Reject The Request, Which Will Mark The Booking As Invalid. This Gives Professionals Flexibility To Manage Client Appointments Proactively.",
      },
      {
        id: "invoices-and-refunds",
        question: "How Do I Manage Invoices And Refunds?",
        answer:
          "All Financial Activity For Each Booking Is Visible In The Sales Section. Here, You Can View And Download Receipts And Invoices, Issue Refunds, And Track Outstanding Balances Directly From The Same Interface.",
      },
      {
        id: "project-bookings",
        question: "Who Can Book Project Bookings?",
        answer:
          "Project Bookings Are A Special Feature Available Only For Company Clients (BC). These Bookings Are Designed For Small To Large-Scale Creative Or Production Services — Such As Photo Shoots For Marketing Campaigns, Media Projects, Or Film Work. They Allow Professionals To Manage Projects That May Include Several Services And Planning Stages. Company Clients Can Add A Project Description, Upload Images Or Files, And Create A Timeline By Adding Planning Details Directly Within The Booking.",
      },
      {
        id: "availability",
        question: "How Is My Availability Managed?",
        answer:
          "You Can Manage Your Availability In Two Ways:\n- In The Availability Settings Page, Where You Can Set Your Schedule For Longer Periods And Include Block Times.\n- Directly In The Calendar Overview, Where You Can Edit Existing Availability Or Add Block Time To Specific Days Or Team Members.",
      },
      {
        id: "reviews",
        question: "How Does Mollure Handle Reviews?",
        answer:
          "Only Clients Who Have Completed And Paid For Their Booking Online Can Leave A Validated Review. This Ensures That All Ratings On Mollure Reflect Real, Verified Experiences Between Professionals And Clients.",
      },
    ],
  },
} as const;
