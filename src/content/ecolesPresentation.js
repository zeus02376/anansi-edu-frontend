// Présentation rédactionnelle des écoles, repérée par leur code.
//
// SOLUTION TEMPORAIRE, même principe que utils/ecoleAccent.js : le modèle `Ecole` du
// backend n'a qu'une description courte (pas de champ `descriptionLongue`). Tant qu'il n'en
// aura pas, le texte long vit ici ; il devra migrer en base, éditable par le personnel.
//
// `statutDonnees: 'A_CONFIRMER'` : ce texte est une rédaction raisonnable à partir du
// contenu public de l'école, pas un contenu validé par l'IUC. La page l'affiche avec le
// bandeau « en cours de vérification ». Une école absente de cette liste est gérée par la
// page (« Présentation en cours de rédaction »), jamais par une erreur.
export const presentationParCode = {
  SEAS: {
    descriptionLongue:
      'SEAS (School of Engineering and Applied Sciences) est l’école d’ingénierie et de sciences ' +
      'appliquées de l’Institut Universitaire de la Côte, à Douala. Elle propose des formations ' +
      'scientifiques, techniques et de gestion, du HND aux cycles Bachelor et ingénieur, dans des ' +
      'domaines comme l’informatique et les systèmes d’information, l’électricité et l’électronique, ' +
      'les télécommunications ou l’administration des affaires. L’enseignement y est dispensé en ' +
      'anglais. Les programmes relèvent de la tutelle de la University of Buea et du MINESUP.',
    statutDonnees: 'A_CONFIRMER',
  },
}
