import { Suspense } from "react";
import AdminMessagingPage from "../../../components/admin/pages/AdminMessagingPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminMessagingPage />
    </Suspense>
  );
}
