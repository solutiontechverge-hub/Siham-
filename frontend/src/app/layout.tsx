import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Mollure",
  description: "Book beauty and wellness services with Mollure",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
