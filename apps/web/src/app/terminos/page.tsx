import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = { title: "Términos" };

export default function TermsPage() {
  return <LegalPage doc="terms" />;
}
