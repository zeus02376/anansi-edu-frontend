import { Suspense } from "react";
import Vue from "./vue";

// Le contenu n'apparaît qu'une fois la session vérifiée dans le navigateur :
// Next ne peut donc pas valider la « navigation instantanée » de cette page.
export const instant = false;

type Params = PageProps<"/scolarite/dossiers/[id]">["params"];

// `params` est une Promise : on l'attend sous <Suspense>.
async function Contenu({ params }: { params: Params }) {
  const { id } = await params;
  return <Vue id={id} />;
}

export default function Page({ params }: PageProps<"/scolarite/dossiers/[id]">) {
  return (
    <Suspense fallback={null}>
      <Contenu params={params} />
    </Suspense>
  );
}
