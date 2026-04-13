import { MarketingSiteHeader } from "../../../components/common";

export default function FixedLocationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingSiteHeader navItems={[]} primaryActionLabel="signup" primaryActionHref="/signup" professionalLinkLabel="" withDivider />
      {children}
    </>
  );
}

