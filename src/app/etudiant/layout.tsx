import { Espace } from "@/components/Espace";
import { ROLES_PAR_ESPACE } from "@/lib/roles";

// Espace étudiant : réservé au rôle ETUDIANT.
export default function EtudiantLayout({ children }: LayoutProps<"/etudiant">) {
  return <Espace roles={ROLES_PAR_ESPACE["/etudiant"]}>{children}</Espace>;
}
