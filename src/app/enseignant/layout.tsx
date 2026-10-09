import { Espace } from "@/components/Espace";

// Espace enseignant : réservé au rôle ENSEIGNANT.
export default function EnseignantLayout({ children }: LayoutProps<"/enseignant">) {
  return <Espace roles={["ENSEIGNANT"]}>{children}</Espace>;
}
