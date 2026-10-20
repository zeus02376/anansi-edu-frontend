import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FiliereCard from '../../components/public/FiliereCard'
import { inputClass } from '../../components/ui/styles'
import { fetchCampus, fetchEcoles, fetchFilieres } from '../../services/catalogue'
import { langueFilters } from '../../utils/catalogue'
import { getErrorMessage } from '../../utils/errors'
import { usePageTitle } from '../../utils/usePageTitle'

const SEARCH_DELAY_MS = 350

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5" aria-hidden="true">
      <div className="h-5 w-24 rounded-full bg-slate-100" />
      <div className="mt-4 h-5 w-3/4 rounded bg-slate-100" />
      <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <div className="h-8 rounded bg-slate-100" />
        <div className="h-8 rounded bg-slate-100" />
      </div>
    </div>
  )
}

function Filieres() {
  usePageTitle('Filières')
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const campusId = params.get('campus') ?? ''
  const ecoleId = params.get('ecole') ?? ''
  const langue = params.get('langue') ?? ''

  const [search, setSearch] = useState(q)
  const [filieres, setFilieres] = useState([])
  const [campus, setCampus] = useState([])
  const [ecoles, setEcoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const updateParams = useCallback(
    (changes) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          Object.entries(changes).forEach(([key, value]) => {
            if (value) next.set(key, value)
            else next.delete(key)
          })
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  // La saisie est répercutée dans l'URL après une courte pause (une requête par mot, pas par lettre)
  useEffect(() => {
    if (search.trim() === q) return undefined
    const timer = setTimeout(() => updateParams({ q: search.trim() }), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [search, q, updateParams])

  // Options des filtres : campus et écoles (un échec ne bloque pas la liste)
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([fetchCampus(controller.signal), fetchEcoles(controller.signal)])
      .then(([campusList, ecoleList]) => {
        setCampus(campusList)
        setEcoles(ecoleList)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  // Filières filtrées côté serveur (langue, mot-clé, campus) ; l'école se filtre ensuite ici
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetchFilieres({ motCle: q, campusId, langue }, controller.signal)
      .then((data) => {
        setFilieres(data)
        setLoading(false)
      })
      .catch((requestError) => {
        if (requestError.code === 'ERR_CANCELED') return
        setError(getErrorMessage(requestError, 'Impossible de charger les filières.'))
        setLoading(false)
      })
    return () => controller.abort()
  }, [q, campusId, langue, attempt])

  const ecolesProposees = useMemo(
    () => ecoles.filter((ecole) => !campusId || ecole.campusId === campusId),
    [ecoles, campusId],
  )
  const visibles = useMemo(
    () => filieres.filter((filiere) => !ecoleId || filiere.ecoleId === ecoleId),
    [filieres, ecoleId],
  )
  const filtresActifs = Boolean(q || campusId || ecoleId || langue)

  const choisirCampus = (value) => {
    // Une école d'un autre campus ne peut plus rester sélectionnée
    const ecoleCompatible = ecoles.some((e) => e.id === ecoleId && (!value || e.campusId === value))
    updateParams({ campus: value, ecole: ecoleCompatible ? ecoleId : '' })
  }

  const reinitialiser = () => {
    setSearch('')
    setParams({}, { replace: true })
  }

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
          <p className="text-sm font-semibold text-iuc-blue">Catalogue</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Nos filières</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Parcourez les formations proposées par école et par campus, puis ouvrez une fiche
            pour connaître le niveau d’entrée, les frais et les pièces à fournir.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <form
          role="search"
          aria-label="Filtrer les filières"
          className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.4fr_1fr_auto] lg:items-end"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="block text-xs font-semibold text-slate-500">
            Mot-clé
            <input
              className={`${inputClass} mt-1`}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Informatique, ingénierie…"
              type="search"
              value={search}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-500">
            Campus
            <select
              className={`${inputClass} mt-1`}
              onChange={(event) => choisirCampus(event.target.value)}
              value={campusId}
            >
              <option value="">Tous les campus</option>
              {campus.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-500">
            École
            <select
              className={`${inputClass} mt-1`}
              onChange={(event) => updateParams({ ecole: event.target.value })}
              value={ecoleId}
            >
              <option value="">Toutes les écoles</option>
              {ecolesProposees.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-500">
            Langue
            <select
              className={`${inputClass} mt-1`}
              onChange={(event) => updateParams({ langue: event.target.value })}
              value={langue}
            >
              <option value="">Toutes</option>
              {langueFilters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!filtresActifs}
            onClick={reinitialiser}
            type="button"
          >
            Réinitialiser
          </button>
        </form>

        {error ? (
          <div
            className="mt-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <span>{error}</span>
            <button
              className="shrink-0 font-bold underline"
              onClick={() => setAttempt((count) => count + 1)}
              type="button"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            <p aria-live="polite" className="mt-6 text-sm text-slate-500">
              {loading && filieres.length === 0
                ? 'Chargement des filières…'
                : `${visibles.length} filière${visibles.length > 1 ? 's' : ''}`}
            </p>

            {loading && filieres.length === 0 ? (
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : visibles.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="font-semibold text-slate-700">Aucune filière ne correspond</p>
                <p className="mt-2 text-sm text-slate-400">
                  Essayez d’autres mots-clés ou retirez un filtre.
                </p>
                {filtresActifs && (
                  <button
                    className="mt-4 text-sm font-bold text-iuc-blue underline"
                    onClick={reinitialiser}
                    type="button"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div
                aria-busy={loading}
                className={`mt-4 grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
                  loading ? 'opacity-60' : ''
                }`}
              >
                {visibles.map((filiere) => (
                  <FiliereCard key={filiere.id} filiere={filiere} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default Filieres
