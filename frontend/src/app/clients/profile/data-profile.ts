export const profilePageData = {
  pageBg: "#E6F7F8",
  header: {
    userDisplayNameFallback: "Sara Johnson",
  },
  tabs: [
    { id: "profile" as const, label: "Profile", href: "/client/profile" },
    { id: "booking" as const, label: "Booking", href: "/client/booking" },
    { id: "favourites" as const, label: "Favourites", href: "/client/favourites" },
  ],
  card: {
    title: "User Info",
    profilePictureLabel: "Profile Picture",
  },
  sections: {
    personal: "Personal Information",
    contact: "Contact Information",
  },
  fields: {
    firstName: { label: "First Name", placeholder: "e.g Jane" },
    lastName: { label: "Last Name", placeholder: "e.g Doe" },
    reviewName: {
      label: "Select name for rating/review",
      placeholder: "First Name",
    },
    birthDate: { label: "Birth date", placeholder: "MM/DD/YY" },
    gender: { label: "Select Gender (Non Editable)" },
    countryCode: { label: "Country Code" },
    phone: { label: "Contact Number", placeholder: "+442xxxxxxxxxxx" },
    email: { label: "Email (Non Editable)", placeholder: "You@gmail.com" },
    password: { label: "Password*", placeholder: "Enter Password" },
    repeatPassword: { label: "Repeat password*", placeholder: "Confirm Password" },
  },
  reviewNameOptions: [
    { value: "first_name", label: "First Name" },
    { value: "last_name", label: "Last Name" },
    { value: "full_name", label: "Full Name" },
  ],
  genderOptions: [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
    { value: "other", label: "Other" },
  ],
  countryCodeOptions: [
    { value: "+44", label: "+44" },
    { value: "+31", label: "+31" },
    { value: "+1", label: "+1" },
    { value: "+92", label: "+92" },
  ],
  links: {
    terms: { label: "Terms & Conditions", href: "/terms" },
  },
  actions: {
    update: "Update",
  },
  popovers: {
    profileMenu: {
      managePrivacyLabel: "Manage Privacy",
      deleteAccountLabel: "Delete Account",
      logoutLabel: "Logout",
    },
    manageSharing: {
      title: "Manage Information Sharing",
      description:
        "Control Which Personal Details Are Visible To Professionals You Are Connected With. Your Information Is Private By Default.",
      doneLabel: "Done",
      cancelLabel: "Cancel",
      fields: [
        { key: "lastName", label: "Last Name", defaultChecked: true },
        { key: "email", label: "Email", defaultChecked: true },
        { key: "birthDate", label: "Birth Date", defaultChecked: true },
        { key: "contactNo", label: "Contact No", defaultChecked: true },
      ],
    },
    notifications: {
      title: "Notifications",
      items: [
        {
          id: "n1",
          professionalName: "Professional Name",
          statusLabel: "New Booking Request",
          statusType: "pending",
          bookingIdLabel: "Booking ID: #BK234432",
          timeLabel: "Today (11:30 pm)",
        },
        {
          id: "n2",
          professionalName: "Professional Name",
          statusLabel: "Booking Request Accepted",
          statusType: "accepted",
          bookingIdLabel: "Booking ID: #BK234432",
          timeLabel: "Yesterday, 2022(11:30 pm)",
        },
        {
          id: "n3",
          professionalName: "Professional Name",
          statusLabel: "Booking Request Rejected",
          statusType: "rejected",
          bookingIdLabel: "Booking ID: #BK234432",
          timeLabel: "Wed, 9 May 2022(11:30 pm)",
        },
        {
          id: "n4",
          professionalName: "Professional Name",
          statusLabel: "Booking Request Rejected",
          statusType: "updated",
          bookingIdLabel: "Booking ID: #BK234432",
          timeLabel: "Wed, 9 May 2022(11:30 pm)",
        },
        {
          id: "n5",
          professionalName: "Professional Name",
          statusLabel: "New Edit Request",
          statusType: "pending",
          bookingIdLabel: "Booking ID: #BK234432",
          timeLabel: "Wed, 9 May 2022(11:30 pm)",
        },
        {
          id: "n6",
          professionalName: "Professional Name",
          statusLabel: "Edit Request Accepted",
          statusType: "accepted",
          bookingIdLabel: "Booking ID: #BK234432",
          timeLabel: "Wed, 9 May 2022(11:30 pm)",
        },
      ],
    },
  },
} as const;
