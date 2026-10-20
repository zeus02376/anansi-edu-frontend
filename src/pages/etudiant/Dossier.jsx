import DashboardLayout from '../../components/DashboardLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import { Carte, Champ, Etat } from '../../components/ui/Etat'
import { fetchMaCandidature, fetchMesInscriptions, fetchMonProfilEtudiant } from '../../services/moi'
import { formatDate } from '../../utils/format'
import { inscriptionLabels, inscriptionStyles, nomComplet, typeDocumentLabels } from '../../utils/moi'
import { useRessource } from '../../utils/useRessource'
import { usePageTitle } from '../../utils/usePageTitle'

function Profil() {
  const { data, loading, error, introuvable, recharger } = useRessource(fetchMonProfilEtudiant)
  return (
    <Carte titre="Mon profil">
      <Etat
        error={error}
        loading={loading}
        onRetry={recharger}
        vide={introuvable ? 'Votre profil étudiant n’est pas encore disponible.' : ''}
      >
        {data && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nom">{nomComplet(data.user)}</Champ>
            <Champ label="Matricule">{data.matricule}</Champ>
            <Champ label="E-mail">{data.user?.email}</Champ>
            <Champ label="Nationalité">{data.nationalite}</Champ>
            <Champ label="Date de naissance">{formatDate(data.dateNaissance)}</Champ>
            <Champ label="Lieu de naissance">{data.lieuNaissance}</Champ>
          </dl>
        )}
      </Etat>
    </Carte>
  )
}

function Inscriptions() {
  const { data, loading, error, recharger } = useRessource(fetchMesInscriptions)
  return (
    <Carte titre="Mes inscriptions">
      <Etat
        error={error}
        loading={loading}
        onRetry={recharger}
        vide={data && data.length === 0 ? 'Aucune inscription pour le moment.' : ''}
      >
        {data && (
          <ul className="divide-y divide-slate-100">
            {data.map((inscription) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={inscription.id}>
                <div>
                  <p className="font-semibold text-slate-900">
                    {inscription.niveau?.nom}
                    {inscription.niveau?.code ? ` (${inscription.niveau.code})` : ''}
                  </p>
                  <p className="text-sm text-slate-500">
                    Année {inscription.anneeAcademique?.libelle} · inscrit le {formatDate(inscription.dateInscription)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                      inscriptionStyles[inscription.statut] ?? 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {inscriptionLabels[inscription.statut] ?? inscription.statut}
                  </span>
                  <span className="text-xs text-slate-500">
                    {inscription.fraisPayes ? 'Frais payés' : 'Frais à régler'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Etat>
    </Carte>
  )
}

function Candidature() {
  const { data, loading, error, introuvable, recharger } = useRessource(fetchMaCandidature)
  return (
    <Carte titre="Ma candidature d’origine">
      <Etat
        error={error}
        loading={loading}
        onRetry={recharger}
        vide={introuvable ? 'Aucune candidature n’est associée à ce compte.' : ''}
      >
        {data && (
          <div className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Champ label="Numéro de dossier">
                <span className="font-mono font-semibold">{data.numeroDossier}</span>
              </Champ>
              <Champ label="Statut">
                <StatusBadge statut={data.statut} />
              </Champ>
              <Champ label="Filière">
                {data.filiere?.nom}
                {data.filiere?.ecole?.nom ? ` — ${data.filiere.ecole.nom}` : ''}
              </Champ>
              <Champ label="Année">{data.anneeAcademique?.libelle}</Champ>
              <Champ label="Déposée le">{formatDate(data.createdAt)}</Champ>
            </dl>
            {data.documents?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pièces</p>
                <ul className="mt-1 space-y-1 text-sm text-slate-700">
                  {data.documents.map((document) => (
                    <li key={document.id}>
                      {typeDocumentLabels[document.typeDocument] ?? document.typeDocument}
                      {' — '}
                      <span className={document.valide ? 'text-emerald-700' : 'text-slate-500'}>
                        {document.valide ? 'validée' : 'en attente de validation'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Etat>
    </Carte>
  )
}

function Dossier() {
  usePageTitle('Mon dossier')
  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-iuc-blue">Espace étudiant</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Mon dossier</h1>
        <p className="mt-2 text-sm text-slate-500">
          Votre profil, vos inscriptions et votre candidature d’origine.
        </p>
      </div>
      <div className="space-y-6">
        <Profil />
        <Inscriptions />
        <Candidature />
      </div>
    </DashboardLayout>
  )
}

export default Dossier
