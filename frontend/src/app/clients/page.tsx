"use client";

import ClientsLanding from "../../components/common/ClientsLanding";
import { clientsPageData } from "./clients.data";

export default function ClientsMarketingPage() {
  return <ClientsLanding data={clientsPageData} />;
}
