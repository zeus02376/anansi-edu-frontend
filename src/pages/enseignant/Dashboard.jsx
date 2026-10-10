import DashboardLayout from '../../components/DashboardLayout'

function Dashboard() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-sm font-semibold text-iuc-blue">Espace enseignant</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Tableau de bord Enseignant
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Retrouvez bientôt vos matières et vos affectations pédagogiques ici.
        </p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-slate-900">Bienvenue dans votre espace</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Vos informations pédagogiques seront disponibles dans cette rubrique.
        </p>
      </section>
    </DashboardLayout>
  )
}

export default Dashboard
