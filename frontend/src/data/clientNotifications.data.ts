export type ClientNotificationStatusType = "pending" | "accepted" | "rejected" | "updated";

export type ClientNotificationItem = {
  id: string;
  professionalName: string;
  statusLabel: string;
  statusType: ClientNotificationStatusType;
  bookingIdLabel: string;
  timeLabel: string;
};

export const clientNotificationsData = {
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
  ] satisfies ClientNotificationItem[],
} as const;

