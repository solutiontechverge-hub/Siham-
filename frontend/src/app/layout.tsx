import "./globals.css";
import ThemeRegistry from "../theme/ThemeRegistry";
import StoreProvider from "../store/provider";

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
        <StoreProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
        </StoreProvider>
      </body>
    </html>
  );
}
