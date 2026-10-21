import { useCallback, useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import ReleveAnnee from '../../components/notes/ReleveAnnee'
import { Etat } from '../../components/ui/Etat'
import { inputClass } from '../../components/ui/styles'
import { fetchMesNotes } from '../../services/moi'
import { anneeCourante } from '../../utils/notes'
import { useRessource } from '../../utils/useRessource'
import { usePageTitle } from '../../utils/usePageTitle'

function Notes() {
  usePageTitle('Mes notes')
  // '' = année par défaut (celle en cours) ; sinon l'année choisie, demandée au serveur (anneeId)
  const [choix, setChoix] = useState('')
  const [annees, setAnnees] = useState([])
  const fetcher = useCallback((signal) => fetchMesNotes(choix || undefined, signal), [choix])
  const { data, loading, error, recharger } = useRessource(fetcher)

  // La liste des années vient de la première réponse (sans anneeId) et reste affichée ensuite
  useEffect(() => {
    if (!choix && data?.annees) setAnnees(data.annees.map(({ annee }) => annee))
  }, [data, choix])

  const affichee = data ? (data.annees.find(({ annee }) => annee.id === choix) ?? anneeCourante(data.annees)) : null
  const valeurSelect = choix || affichee?.annee.id || ''

  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-iuc-blue">Espace étudiant</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Mes notes</h1>
        <p className="mt-2 text-sm text-slate-500">
          Vos notes publiées et vos moyennes, par année académique.
        </p>
      </div>

      {annees.length > 0 && (
        <div className="mb-6 max-w-xs">
          <label className="block text-sm font-semibold text-slate-700">
            Année académique
            <select
              className={`${inputClass} mt-1.5`}
              onChange={(event) => setChoix(event.target.value)}
              value={valeurSelect}
            >
              {annees.map((annee) => (
                <option key={annee.id} value={annee.id}>
                  {annee.libelle}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <Etat
        error={error}
        loading={loading}
        onRetry={recharger}
        vide={
          data && data.annees.length === 0
            ? 'Aucune note à afficher : vous n’avez pas d’inscription pour cette période. Vos notes apparaîtront ici dès leur publication.'
            : ''
        }
      >
        {affichee && <ReleveAnnee annee={affichee} />}
      </Etat>
    </DashboardLayout>
  )
}

export default Notes
