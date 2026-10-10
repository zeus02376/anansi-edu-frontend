import type { ReactNode } from "react";
import { Espace } from "@/components/Espace";
import { ROLES } from "@/lib/roles";

// Pages ouvertes à toute personne connectée : /candidature et /suivi.
export default function CandidatLayout({ children }: { children: ReactNode }) {
  return <Espace roles={ROLES}>{children}</Espace>;
}
