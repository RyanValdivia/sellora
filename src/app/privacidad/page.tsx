import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = { title: "Privacidad" };

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}
