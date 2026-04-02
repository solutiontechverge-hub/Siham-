import "./globals.css";
import ThemeRegistry from "../theme/ThemeRegistry";

export const metadata = {
  title: "Mollure Frontend",
  description: "Next.js + MUI setup",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
