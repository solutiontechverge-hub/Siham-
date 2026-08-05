/** Copy and media for the About (Our Story) page — typography: headings 600, body 400; colors from theme. */

export const aboutPageData = {
  hero: {
    title: "Our Story, Vision, And Values",
    subtitle: "Discover The Principles And Ideas That Shape Everything We Do.",
    imageSrc: "/about/hero-banner.png",
    imageAlt: "Hand holding a light bulb — ideas and vision for Mollure.",
  },
  split: {
    imageSrc: "/about/about-gears-photo.png",
    imageAlt:
      "Two hands meshing silver and gold gears over salon tools — precision and care.",
    panelTitle: "About Us",
    paragraphs: [
      "Most booking platforms focus on automation and speed, but often overlook something essential: real conversation. In beauty and grooming, people want clarity before committing. They have questions about treatments, preferences, locations, or what will work best for them.",
      "Mollure is built around interaction, not just instant confirmations. You can message professionals directly, ask questions, discuss details, and request changes within the booking itself. Every conversation stays connected and clear.",
      "Whether you visit a professional or invite them to your location, each booking is transparent and easy to manage, giving you the clarity and control you expect.",
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
        id: "who-for",
        question: "Who Can Use Mollure?",
        answer:
          "Individuals and businesses can book services, while salons and independent professionals can publish availability, manage requests, and communicate in one place.",
      },
      {
        id: "booking",
        question: "How Does Booking Work?",
        answer:
          "Some bookings confirm instantly; others may require review. Important changes typically need approval so nothing moves forward without clarity.",
      },
      {
        id: "cost",
        question: "Is There A Cost To Join?",
        answer:
          "Pricing depends on your plan. Many teams start with core features and scale as they grow — check our pricing page for current options.",
      },
    ],
  },
} as const;
