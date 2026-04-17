import { MarketingSiteHeader } from "../../../components/common";

export default function DesiredLocationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingSiteHeader
        navItems={[]}
        primaryActionLabel="signup"
        primaryActionHref="/auth/signup"
        professionalLinkLabel=""
        withDivider
      />
      {children}
    </>
  );
}

