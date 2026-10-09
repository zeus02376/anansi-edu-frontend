import { Espace } from "@/components/Espace";

// Espace scolarité : rôles SCOLARITE et ADMIN.
export default function ScolariteLayout({ children }: LayoutProps<"/scolarite">) {
  return <Espace roles={["SCOLARITE", "ADMIN"]}>{children}</Espace>;
}
