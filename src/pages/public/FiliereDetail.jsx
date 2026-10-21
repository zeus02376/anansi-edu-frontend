import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PropTypes from 'prop-types'
import { MessagePage, SqueletteDetail } from '../../components/public/EtatPage'
import { fetchFiliere } from '../../services/catalogue'
import {
  cycleLabels,
  formatDuree,
  formatMontant,
  langueLabels,
  modeAdmissionLabels,
  regimeLabels,
} from '../../utils/catalogue'
import { ecoleAccent } from '../../utils/ecoleAccent'
import { getErrorMessage } from '../../utils/errors'
import { usePageTitle } from '../../utils/usePageTitle'

const A_PRECISER = <span className="font-normal text-slate-400">À préciser</span>

function Fact({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">{children ?? A_PRECISER}</dd>
    </div>
  )
}

Fact.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node }

function FiliereDetail() {
  const { id } = useParams()
  const [filiere, setFiliere] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  usePageTitle(filiere?.nom ?? 'Filière')

  useEffect(() => {
    const controller = new AbortController()
    setFiliere(null)
    setError(null)
    fetchFiliere(id, controller.signal)
      .then(setFiliere)
      .catch((requestError) => {
        if (requestError.code === 'ERR_CANCELED') return
        setError({
          notFound: [400, 404].includes(requestError.response?.status),
          message: getErrorMessage(requestError, 'Impossible de charger cette filière.'),
        })
      })
    return () => controller.abort()
  }, [id, attempt])

  if (error?.notFound) {
    return (
      <MessagePage title="Filière introuvable">
        Cette filière n’existe pas ou n’est plus proposée.
      </MessagePage>
    )
  }
  if (error) {
    return (
      <MessagePage title="Chargement impossible">
        <p role="alert">{error.message}</p>
        <button
          className="mt-3 font-bold text-iuc-red underline"
          onClick={() => setAttempt((count) => count + 1)}
          type="button"
        >
          Réessayer
        </button>
      </MessagePage>
    )
  }
  if (!filiere) return <SqueletteDetail label="Chargement de la filière…" />

  const { ecole } = filiere
  const accent = ecoleAccent(ecole)
  const national = formatMontant(filiere.fraisCandidatureNational)
  const etranger = formatMontant(filiere.fraisCandidatureEtranger)

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
          <nav aria-label="Fil d’Ariane" className="text-sm text-slate-400">
            <Link className="hover:text-iuc-red" to="/filieres">
              Filières
            </Link>
            <span aria-hidden="true"> › </span>
            <span className="text-slate-600">{filiere.nom}</span>
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-iuc-red/10 px-2.5 py-1 text-xs font-bold text-iuc-red">
              {cycleLabels[filiere.cycle] ?? filiere.cycle}
            </span>
            {filiere.langue && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {langueLabels[filiere.langue] ?? filiere.langue}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            {filiere.nom}
          </h1>
          <p className="mt-2 text-slate-500">
            <span className={accent.text}>{ecole.nom}</span>
            {ecole.campus ? ` · Campus ${ecole.campus.nom}` : ''}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {filiere.statutDonnees === 'A_CONFIRMER' && (
            <p
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
              role="note"
            >
              Certaines informations de cette fiche sont en cours de vérification auprès de
              l’établissement et peuvent évoluer.
            </p>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-iuc-red">La formation</h2>
            <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <Fact label="Code">{filiere.code}</Fact>
              <Fact label="Durée">{formatDuree(filiere.dureeAnnees)}</Fact>
              <Fact label="Crédits">{filiere.credits ? `${filiere.credits} crédits` : null}</Fact>
              <Fact label="Régime">{regimeLabels[filiere.regime] ?? filiere.regime}</Fact>
              <Fact label="Tutelle">{filiere.tutelle}</Fact>
              <Fact label="Langue">{langueLabels[filiere.langue] ?? filiere.langue}</Fact>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-iuc-red">Admission</h2>
            <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <Fact label="Niveau d’entrée">{filiere.niveauEntree}</Fact>
              <Fact label="Diplôme requis">{filiere.diplomeRequis}</Fact>
              <Fact label="Mode d’admission">
                {modeAdmissionLabels[filiere.modeAdmission] ?? filiere.modeAdmission}
              </Fact>
            </dl>
            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Pièces à fournir
            </h3>
            {filiere.piecesRequises?.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {filiere.piecesRequises.map((piece) => (
                  <li className="flex items-start gap-2 text-sm text-slate-700" key={piece}>
                    <span aria-hidden="true" className="font-bold text-iuc-green">
                      ✓
                    </span>
                    {piece}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm">{A_PRECISER}</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-iuc-red">L’école et le campus</h2>
            <p className={`mt-4 text-sm font-semibold ${accent.text || 'text-slate-800'}`}>
              <Link
                className="rounded underline-offset-2 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-iuc-red/20"
                to={`/ecoles/${ecole.id}`}
              >
                {ecole.nom}
              </Link>
            </p>
            {ecole.description && (
              <p className="mt-1 text-sm leading-6 text-slate-500">{ecole.description}</p>
            )}
            {ecole.campus && (
              <p className="mt-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Campus {ecole.campus.nom}</span>
                {ecole.campus.adresse ? ` — ${ecole.campus.adresse}` : ''}
              </p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-iuc-red">Frais de candidature</h2>
            <dl className="mt-4 space-y-3">
              <Fact label="Candidats nationaux">{national}</Fact>
              <Fact label="Candidats étrangers">{etranger}</Fact>
            </dl>
            <Link
              className="mt-6 flex w-full justify-center rounded-xl bg-iuc-red px-4 py-3 text-sm font-bold text-white transition hover:bg-iuc-red/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-iuc-red/20"
              to={`/candidature?filiere=${filiere.id}`}
            >
              Candidater à cette filière
            </Link>
            <Link
              className="mt-3 block text-center text-sm font-semibold text-slate-500 hover:text-iuc-red"
              to="/filieres"
            >
              ← Toutes les filières
            </Link>
          </div>
        </aside>
      </div>
    </>
  )
}

export default FiliereDetail
