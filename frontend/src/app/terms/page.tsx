import { redirect } from "next/navigation";

/** Legacy `/terms` route — keep old links working. */
export default function TermsRedirectPage() {
  redirect("/terms-and-conditions");
}
