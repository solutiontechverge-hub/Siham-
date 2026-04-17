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
      "Most Booking Platforms Focus On Automation And Speed, But Often Overlook Something Essential: Real Conversation. In Beauty And Grooming, People Want Clarity Before Committing. They Have Questions About Treatments, Preferences, Locations, Or What Will Work Best For Them.",
      "Mollure Is Built Around Interaction, Not Just Instant Confirmations. You Can Message Professionals Directly, Ask Questions, Discuss Details, And Request Changes Within The Booking Itself. Every Conversation Stays Connected And Clear.",
      "Whether You Visit A Professional Or Invite Them To Your Location, Each Booking Is Transparent And Easy To Manage, Giving You The Clarity And Control You Expect.",
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        id: "what-is",
        question: "What Is Mollure?",
        answer:
          "Mollure is an all-in-one platform for booking and managing beauty and grooming appointments — with interactive flows that keep clients and professionals aligned.",
      },
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
