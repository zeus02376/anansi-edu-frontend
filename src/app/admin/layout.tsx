import { Espace } from "@/components/Espace";

// Espace administration : réservé au rôle ADMIN.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <Espace roles={["ADMIN"]}>{children}</Espace>;
}
