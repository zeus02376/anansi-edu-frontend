import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { Carte, Etat } from '../../components/ui/Etat'
import { fetchMesInscriptions, fetchMonProfilEtudiant, fetchToutesMesNotes } from '../../services/moi'
import { inscriptionEnCours, inscriptionLabels, nomComplet } from '../../utils/moi'
import { anneeCourante, formatNombre } from '../../utils/notes'
import { useRessource } from '../../utils/useRessource'
import { usePageTitle } from '../../utils/usePageTitle'

function Dashboard() {
  usePageTitle('Tableau de bord')
  const profil = useRessource(fetchMonProfilEtudiant)
  const inscriptions = useRessource(fetchMesInscriptions)
  const enCours = inscriptionEnCours(inscriptions.data)
  const notes = useRessource(fetchToutesMesNotes)
  const anneeNotes = anneeCourante(notes.data?.annees)

  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-iuc-red">Espace étudiant</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          {profil.data ? `Bonjour ${nomComplet(profil.data.user)}` : 'Tableau de bord Étudiant'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Suivez votre dossier et votre parcours académique.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Carte titre="Mon profil">
          <Etat
            error={profil.error}
            loading={profil.loading}
            onRetry={profil.recharger}
            vide={profil.introuvable ? 'Votre profil étudiant n’est pas encore disponible.' : ''}
          >
            {profil.data && (
              <p className="text-sm text-slate-700">
                Matricule <span className="font-mono font-semibold">{profil.data.matricule}</span>
                <br />
                {profil.data.user?.email}
              </p>
            )}
          </Etat>
        </Carte>
        <Carte titre="Inscription en cours">
          <Etat
            error={inscriptions.error}
            loading={inscriptions.loading}
            onRetry={inscriptions.recharger}
            vide={!enCours && !inscriptions.error ? 'Aucune inscription pour le moment.' : ''}
          >
            {enCours && (
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">
                  {enCours.niveau?.nom}
                  {enCours.niveau?.code ? ` (${enCours.niveau.code})` : ''}
                </span>
                <br />
                Année {enCours.anneeAcademique?.libelle} ·{' '}
                {inscriptionLabels[enCours.statut] ?? enCours.statut}
              </p>
            )}
          </Etat>
        </Carte>
        <Carte titre="Moyenne générale">
          <Etat
            error={notes.error}
            loading={notes.loading}
            onRetry={notes.recharger}
            vide={!anneeNotes && !notes.error ? 'Aucune note pour le moment.' : ''}
          >
            {anneeNotes && (
              <div>
                {anneeNotes.moyenneGenerale === null ? (
                  <p className="text-sm text-slate-500">Pas encore de moyenne : aucune note publiée.</p>
                ) : (
                  <p className="text-3xl font-black text-iuc-red" data-testid="dashboard-moyenne">
                    {formatNombre(anneeNotes.moyenneGenerale)}
                    <span className="text-base font-semibold text-slate-400"> / 20</span>
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Année {anneeNotes.annee?.libelle}
                  {anneeNotes.provisoire && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-bold uppercase text-amber-800">
                      Provisoire
                    </span>
                  )}
                </p>
              </div>
            )}
          </Etat>
        </Carte>
      </div>
      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link className="font-semibold text-iuc-red underline" to="/etudiant/notes">
          Voir mes notes →
        </Link>
        <Link className="font-semibold text-iuc-red underline" to="/etudiant/dossier">
          Voir tout mon dossier →
        </Link>
      </p>
    </DashboardLayout>
  )
}

export default Dashboard
