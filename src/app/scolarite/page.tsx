import Vue from "./vue";

// Le contenu n'apparaît qu'une fois la session vérifiée dans le navigateur :
// Next ne peut donc pas valider la « navigation instantanée » de cette page.
export const instant = false;

export default function Page() {
  return <Vue />;
}
