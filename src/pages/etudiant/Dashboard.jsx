import DashboardLayout from '../../components/DashboardLayout'

function Dashboard() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-[#1E3A8A]">Espace étudiant</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Tableau de bord Étudiant
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Suivez votre dossier et votre parcours académique.
        </p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-slate-900">Votre parcours, au même endroit</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Les informations de votre dossier étudiant seront affichées dans cet espace.
        </p>
      </section>
    </DashboardLayout>
  )
}

export default Dashboard
