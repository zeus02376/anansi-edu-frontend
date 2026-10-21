import { useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import EvaluationsMatiere from '../../components/notes/EvaluationsMatiere'
import { Carte, Etat } from '../../components/ui/Etat'
import { fetchMesAffectations } from '../../services/moi'
import { useRessource } from '../../utils/useRessource'
import { usePageTitle } from '../../utils/usePageTitle'

const volumes = (matiere) =>
  [
    matiere.heuresCm ? `${matiere.heuresCm} h CM` : '',
    matiere.heuresTd ? `${matiere.heuresTd} h TD` : '',
    matiere.heuresTp ? `${matiere.heuresTp} h TP` : '',
  ]
    .filter(Boolean)
    .join(' · ')

function Matieres() {
  usePageTitle('Mes matières')
  const { data, loading, error, recharger } = useRessource(fetchMesAffectations)
  // Matière dont les évaluations sont dépliées (chargées à l'ouverture)
  const [ouverte, setOuverte] = useState(null)

  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-iuc-blue">Espace enseignant</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Mes matières</h1>
        <p className="mt-2 text-sm text-slate-500">
          Les matières qui vous sont affectées, par année académique.
        </p>
      </div>
      <Carte titre="Mes affectations">
        <Etat
          error={error}
          loading={loading}
          onRetry={recharger}
          vide={data && data.length === 0 ? 'Aucune matière ne vous est affectée pour le moment.' : ''}
        >
          {data && (
            <ul className="divide-y divide-slate-100">
              {data.map((affectation) => (
                <li className="py-3" key={affectation.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {affectation.matiere?.nom}
                      {affectation.matiere?.code ? ` (${affectation.matiere.code})` : ''}
                    </p>
                    <p className="text-sm text-slate-500">
                      {affectation.matiere?.niveau?.nom}
                      {volumes(affectation.matiere ?? {}) ? ` · ${volumes(affectation.matiere)}` : ''}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-iuc-blue">
                      Année {affectation.anneeAcademique?.libelle}
                    </p>
                    {affectation.heuresPrevues > 0 && (
                      <p className="text-slate-500">{affectation.heuresPrevues} h prévues</p>
                    )}
                  </div>
                  </div>
                  <button
                    aria-expanded={ouverte === affectation.matiere?.id}
                    className="mt-3 text-sm font-semibold text-iuc-blue underline"
                    onClick={() =>
                      setOuverte((courante) => (courante === affectation.matiere?.id ? null : affectation.matiere?.id))
                    }
                    type="button"
                  >
                    {ouverte === affectation.matiere?.id ? 'Masquer les évaluations' : 'Évaluations et notes'}
                  </button>
                  {ouverte === affectation.matiere?.id && <EvaluationsMatiere matiereId={affectation.matiere.id} />}
                </li>
              ))}
            </ul>
          )}
        </Etat>
      </Carte>
    </DashboardLayout>
  )
}

export default Matieres
