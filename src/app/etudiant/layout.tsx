import { Espace } from "@/components/Espace";

// Espace étudiant : réservé au rôle ETUDIANT.
export default function EtudiantLayout({ children }: LayoutProps<"/etudiant">) {
  return <Espace roles={["ETUDIANT"]}>{children}</Espace>;
}
