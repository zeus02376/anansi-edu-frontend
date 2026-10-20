import { Link } from 'react-router-dom'
import { usePageTitle } from '../../utils/usePageTitle'

/** Page provisoire : le formulaire de candidature en ligne sera construit ensuite. */
function Candidature() {
  usePageTitle('Candidature')

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-8">
      <p className="text-sm font-semibold text-iuc-blue">Candidature en ligne</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Bientôt disponible</h1>
      <p className="mt-4 text-sm leading-6 text-slate-500">
        Le dépôt de candidature en ligne arrive prochainement. En attendant, parcourez les
        filières pour préparer votre choix.
      </p>
      <Link
        className="mt-8 inline-flex rounded-xl bg-iuc-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-iuc-blue/90"
        to="/filieres"
      >
        Voir les filières
      </Link>
    </div>
  )
}

export default Candidature
