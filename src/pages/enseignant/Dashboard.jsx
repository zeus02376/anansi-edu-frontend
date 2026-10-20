import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { Carte, Champ, Etat } from '../../components/ui/Etat'
import { fetchMonProfilEnseignant } from '../../services/moi'
import { nomComplet, typeEnseignantLabels } from '../../utils/moi'
import { useRessource } from '../../utils/useRessource'
import { usePageTitle } from '../../utils/usePageTitle'

function Dashboard() {
  usePageTitle('Tableau de bord')
  const { data, loading, error, introuvable, recharger } = useRessource(fetchMonProfilEnseignant)

  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-iuc-blue">Espace enseignant</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          {data ? `Bonjour ${nomComplet(data.user)}` : 'Tableau de bord Enseignant'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Retrouvez vos informations et vos affectations pédagogiques.
        </p>
      </div>
      <Carte titre="Mon profil">
        <Etat
          error={error}
          loading={loading}
          onRetry={recharger}
          vide={introuvable ? 'Votre profil enseignant n’est pas encore disponible.' : ''}
        >
          {data && (
            <dl className="grid gap-4 sm:grid-cols-2">
              <Champ label="Nom">{nomComplet(data.user)}</Champ>
              <Champ label="E-mail">{data.user?.email}</Champ>
              <Champ label="Statut">{typeEnseignantLabels[data.type] ?? data.type}</Champ>
              <Champ label="Spécialité">{data.specialite}</Champ>
              {data.cvUrl && (
                <Champ label="CV">
                  <a className="text-iuc-blue underline" href={data.cvUrl} rel="noreferrer" target="_blank">
                    Consulter
                  </a>
                </Champ>
              )}
            </dl>
          )}
        </Etat>
      </Carte>
      <p className="mt-6 text-sm">
        <Link className="font-semibold text-iuc-blue underline" to="/enseignant/matieres">
          Voir mes matières →
        </Link>
      </p>
    </DashboardLayout>
  )
}

export default Dashboard
