import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import ReleveAnnee from '../../components/notes/ReleveAnnee'
import { Carte, Etat } from '../../components/ui/Etat'
import { inputClass } from '../../components/ui/styles'
import { fetchEtudiants, fetchReleve } from '../../services/notesPersonnel'
import { anneeCourante } from '../../utils/notes'
import { useRessource } from '../../utils/useRessource'
import { usePageTitle } from '../../utils/usePageTitle'

const normaliser = (texte) =>
  String(texte ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/**
 * Relevé de notes d'un étudiant (personnel) : notes et moyennes par année, calculées à la
 * volée par le serveur à partir des seules évaluations publiées. Les moyennes sont toujours
 * présentées comme provisoires, comme côté étudiant.
 */
function Releve() {
  usePageTitle('Notes — relevé d’un étudiant')
  const etudiants = useRessource(fetchEtudiants)
  const [recherche, setRecherche] = useState('')
  const [etudiant, setEtudiant] = useState(null)
  const [choix, setChoix] = useState('') // anneeId choisi ('' = année par défaut)
  const [annees, setAnnees] = useState([])

  const resultats = useMemo(() => {
    const terme = normaliser(recherche).trim()
    if (!terme || !etudiants.data) return []
    return etudiants.data
      .filter((e) =>
        normaliser(`${e.user?.prenom} ${e.user?.nom} ${e.user?.nom} ${e.user?.prenom} ${e.matricule} ${e.matriculeIuc ?? ''}`).includes(terme),
      )
      .slice(0, 8)
  }, [etudiants.data, recherche])

  const fetcher = useCallback(
    (signal) => (etudiant ? fetchReleve(etudiant.id, choix || undefined, signal) : Promise.resolve(null)),
    [etudiant, choix],
  )
  const releve = useRessource(fetcher)

  // La liste des années vient de la première réponse (sans anneeId) et reste affichée ensuite
  useEffect(() => {
    if (!choix && releve.data?.annees) setAnnees(releve.data.annees.map(({ annee }) => annee))
  }, [releve.data, choix])

  const choisir = (e) => {
    setEtudiant(e)
    setChoix('')
    setAnnees([])
    setRecherche('')
  }

  const affichee = releve.data
    ? (releve.data.annees.find(({ annee }) => annee.id === choix) ?? anneeCourante(releve.data.annees))
    : null

  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-iuc-red">Espace scolarité</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Relevé de notes</h1>
        <p className="mt-2 text-sm text-slate-500">
          Notes et moyennes d’un étudiant, par année.{' '}
          <Link className="font-semibold text-iuc-red underline" to="/scolarite/notes">
            ← Évaluations
          </Link>
        </p>
      </div>

      <div className="space-y-6">
        <Carte titre="Étudiant">
          <Etat error={etudiants.error} loading={etudiants.loading} onRetry={etudiants.recharger}>
            <label className="block text-sm font-semibold text-slate-700">
              Rechercher par nom, prénom ou matricule
              <input
                autoComplete="off"
                className={`${inputClass} mt-1.5 max-w-md`}
                onChange={(event) => setRecherche(event.target.value)}
                placeholder="Ex. Mballa, IUC-2026-00001, IUC26E1234567…"
                type="search"
                value={recherche}
              />
            </label>
            {recherche.trim() !== '' && (
              <ul className="mt-3 max-w-md divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white" data-testid="resultats">
                {resultats.length === 0 ? (
                  <li className="p-3 text-sm text-slate-500">Aucun étudiant ne correspond à cette recherche.</li>
                ) : (
                  resultats.map((e) => (
                    <li key={e.id}>
                      <button
                        className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                        onClick={() => choisir(e)}
                        type="button"
                      >
                        <span className="font-semibold text-slate-900">
                          {e.user?.prenom} {e.user?.nom}
                        </span>
                        <span className="font-mono text-xs text-slate-500">{e.matriculeIuc ?? e.matricule}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
            {etudiant && (
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700" data-testid="etudiant-choisi">
                <span className="font-semibold text-slate-900">
                  {etudiant.user?.prenom} {etudiant.user?.nom}
                </span>{' '}
                · matricule <span className="font-mono">{etudiant.matricule}</span>
                {etudiant.matriculeIuc && (
                  <>
                    {' '}
                    · IUC <span className="font-mono">{etudiant.matriculeIuc}</span>
                  </>
                )}
              </p>
            )}
          </Etat>
        </Carte>

        {etudiant && (
          <>
            {annees.length > 0 && (
              <div className="max-w-xs">
                <label className="block text-sm font-semibold text-slate-700">
                  Année académique
                  <select
                    className={`${inputClass} mt-1.5`}
                    onChange={(event) => setChoix(event.target.value)}
                    value={choix || affichee?.annee.id || ''}
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
              error={releve.error}
              loading={releve.loading}
              onRetry={releve.recharger}
              vide={
                releve.data && releve.data.annees.length === 0
                  ? 'Cet étudiant n’a aucune inscription pour cette période : pas de relevé.'
                  : ''
              }
            >
              {affichee && <ReleveAnnee annee={affichee} commentaires personnel provisoire />}
            </Etat>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Releve
