import { Espace } from "@/components/Espace";
import { ROLES_PAR_ESPACE } from "@/lib/roles";

// Espace enseignant : réservé au rôle ENSEIGNANT.
export default function EnseignantLayout({ children }: LayoutProps<"/enseignant">) {
  return <Espace roles={ROLES_PAR_ESPACE["/enseignant"]}>{children}</Espace>;
}
