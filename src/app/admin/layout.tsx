import { Espace } from "@/components/Espace";
import { ROLES_PAR_ESPACE } from "@/lib/roles";

// Espace administration : réservé au rôle ADMIN.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <Espace roles={ROLES_PAR_ESPACE["/admin"]}>{children}</Espace>;
}
