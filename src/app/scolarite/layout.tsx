import { Espace } from "@/components/Espace";
import { ROLES_PAR_ESPACE } from "@/lib/roles";

// Espace scolarité : rôles SCOLARITE et ADMIN.
export default function ScolariteLayout({ children }: LayoutProps<"/scolarite">) {
  return <Espace roles={ROLES_PAR_ESPACE["/scolarite"]}>{children}</Espace>;
}
