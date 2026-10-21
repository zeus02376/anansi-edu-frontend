import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { Etat } from '../../components/ui/Etat'
import Field from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import { inputClass } from '../../components/ui/styles'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { inscriptionLabels, inscriptionStyles, nomComplet } from '../../utils/moi'
import { usePageTitle } from '../../utils/usePageTitle'

const statuses = ['EN_ATTENTE', 'VALIDE', 'REJETE', 'SUSPENDU']
/** Libellé d'un niveau : la filière lève l'ambiguïté entre deux « Licence 1 ». */
const niveauLabel = (niveau) =>
  `${niveau.nom} (${niveau.code})${niveau.filiere?.nom ? ` — ${niveau.filiere.nom}` : ''}`

// Le serveur refuse (409) de changer l'étudiant, le niveau, l'année ou le statut d'une inscription notée
const estRefusNotes = (error) =>
  error.response?.status === 409 && String(error.response?.data?.message).includes('porte déjà des notes')

const emptyForm = {
  etudiantId: '',
  niveauId: '',
  anneeAcademiqueId: '',
  statut: 'EN_ATTENTE',
  fraisPayes: false,
}

function Inscriptions() {
  usePageTitle('Inscriptions')
  const [inscriptions, setInscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('TOUS')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [students, setStudents] = useState([])
  const [levels, setLevels] = useState([])
  const [years, setYears] = useState([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [optionsError, setOptionsError] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formErrorType, setFormErrorType] = useState('') // '' | 'conflit' | 'notes'

  const loadInscriptions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/inscriptions')
      if (!Array.isArray(data)) throw new Error('La réponse des inscriptions est invalide.')
      setInscriptions(data)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Impossible de charger les inscriptions.'))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true)
    setOptionsError('')
    try {
      const [studentsResponse, levelsResponse, yearsResponse] = await Promise.all([
        api.get('/etudiants'),
        api.get('/niveaux'),
        api.get('/annees-academiques'),
      ])
      if (
        !Array.isArray(studentsResponse.data) ||
        !Array.isArray(levelsResponse.data) ||
        !Array.isArray(yearsResponse.data)
      ) {
        throw new Error('Les choix du formulaire reçus du serveur sont invalides.')
      }
      setStudents(studentsResponse.data)
      setLevels(levelsResponse.data)
      setYears(yearsResponse.data)
    } catch (requestError) {
      setOptionsError(
        getErrorMessage(requestError, 'Impossible de charger les choix du formulaire.'),
      )
    } finally {
      setOptionsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInscriptions()
  }, [loadInscriptions])

  const filteredInscriptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr')
    return inscriptions.filter((inscription) => {
      const student = inscription.etudiant
      const matchesStatus = statusFilter === 'TOUS' || inscription.statut === statusFilter
      const matchesSearch =
        !query ||
        `${nomComplet(student?.user)} ${student?.matricule ?? ''} ${inscription.niveau?.nom ?? ''} ${
          inscription.anneeAcademique?.libelle ?? ''
        }`
          .toLocaleLowerCase('fr')
          .includes(query)
      return matchesStatus && matchesSearch
    })
  }, [inscriptions, search, statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setFormErrorType('')
    setModalOpen(true)
    loadOptions()
  }

  const openEdit = (inscription) => {
    setEditing(inscription)
    setForm({
      etudiantId: inscription.etudiantId,
      niveauId: inscription.niveauId,
      anneeAcademiqueId: inscription.anneeAcademiqueId,
      statut: inscription.statut,
      fraisPayes: inscription.fraisPayes,
    })
    setFormError('')
    setFormErrorType('')
    setModalOpen(true)
    loadOptions()
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setFormError('')
    setFormErrorType('')
  }

  // Inscription notée : on revient aux valeurs d'origine pour ne modifier que les frais
  const retablirValeursOrigine = () => {
    setForm((current) => ({
      ...current,
      etudiantId: editing.etudiantId,
      niveauId: editing.niveauId,
      anneeAcademiqueId: editing.anneeAcademiqueId,
      statut: editing.statut,
    }))
    setFormError('')
    setFormErrorType('')
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setFormError('')
    setFormErrorType('')
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/inscriptions/${editing.id}`, form)
      } else {
        await api.post('/inscriptions', form)
      }
      setModalOpen(false)
      await loadInscriptions()
    } catch (requestError) {
      setFormError(getErrorMessage(requestError, 'Impossible d’enregistrer l’inscription.'))
      if (estRefusNotes(requestError)) setFormErrorType('notes')
      else if (requestError.response?.status === 409) setFormErrorType('conflit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-iuc-red">Gestion académique</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Inscriptions</h1>
          <p className="mt-2 text-sm text-slate-500">
            Affectez les étudiants à un niveau pour une année académique.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-xl bg-iuc-red px-5 py-3 text-sm font-bold text-white transition hover:bg-iuc-red/90"
          onClick={openCreate}
          type="button"
        >
          Nouvelle inscription
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Rechercher une inscription</span>
          <input
            className={inputClass}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, matricule, niveau ou année"
            type="search"
            value={search}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          Statut
          <select
            className={`${inputClass} sm:w-48`}
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="TOUS">Tous les statuts</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {inscriptionLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Etat
          error={error}
          loading={loading}
          onRetry={loadInscriptions}
          vide={
            filteredInscriptions.length === 0
              ? search || statusFilter !== 'TOUS'
                ? 'Aucune inscription ne correspond à votre recherche.'
                : 'Aucune inscription pour le moment.'
              : ''
          }
        >
          {filteredInscriptions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {[
                      'Étudiant',
                      'Matricule',
                      'Niveau',
                      'Année',
                      'Date d’inscription',
                      'Statut',
                      'Frais',
                      'Actions',
                    ].map((column) => (
                        <th
                          className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-400"
                          key={column}
                        >
                          {column}
                        </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInscriptions.map((inscription) => (
                    <tr className="align-middle hover:bg-slate-50/70" key={inscription.id}>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                        {nomComplet(inscription.etudiant?.user) || '—'}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm text-slate-600">
                        {inscription.etudiant?.matricule || '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {inscription.niveau?.nom || '—'}
                        {inscription.niveau?.code ? ` (${inscription.niveau.code})` : ''}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {inscription.anneeAcademique?.libelle || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                        {formatDate(inscription.dateInscription)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                            inscriptionStyles[inscription.statut] ?? 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inscriptionLabels[inscription.statut] ?? inscription.statut}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {inscription.fraisPayes ? 'Payés' : 'À régler'}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          className="rounded-lg border border-iuc-red/20 px-3 py-2 text-xs font-bold text-iuc-red transition hover:bg-iuc-red/5"
                          onClick={() => openEdit(inscription)}
                          type="button"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Etat>
      </section>

      {!loading && !error && (
        <p className="mt-4 text-xs text-slate-400">
          {filteredInscriptions.length} inscription
          {filteredInscriptions.length === 1 ? '' : 's'} affichée
          {filteredInscriptions.length === 1 ? '' : 's'}
        </p>
      )}

      {modalOpen && (
        <Modal onClose={closeModal} title={editing ? 'Modifier une inscription' : 'Nouvelle inscription'}>
          {optionsLoading ? (
            <p className="py-6 text-center text-sm text-slate-500" role="status">
              Chargement des étudiants et des niveaux…
            </p>
          ) : optionsError ? (
            <div className="space-y-3" role="alert">
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {optionsError}
              </p>
              <button
                className="text-sm font-bold text-iuc-red underline"
                onClick={loadOptions}
                type="button"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <Field label="Étudiant">
                <select
                  className={inputClass}
                  disabled={Boolean(editing)}
                  onChange={(event) => updateForm('etudiantId', event.target.value)}
                  required
                  value={form.etudiantId}
                >
                  <option value="">Sélectionner un étudiant</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {nomComplet(student.user)} — {student.matricule}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Niveau">
                <select
                  className={inputClass}
                  onChange={(event) => updateForm('niveauId', event.target.value)}
                  required
                  value={form.niveauId}
                >
                  <option value="">Sélectionner un niveau</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {niveauLabel(level)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Année académique">
                <select
                  className={inputClass}
                  onChange={(event) => updateForm('anneeAcademiqueId', event.target.value)}
                  required
                  value={form.anneeAcademiqueId}
                >
                  <option value="">Sélectionner une année</option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.libelle}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Statut">
                <select
                  className={inputClass}
                  onChange={(event) => updateForm('statut', event.target.value)}
                  value={form.statut}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {inscriptionLabels[status]}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  checked={form.fraisPayes}
                  className="h-4 w-4 accent-iuc-red"
                  onChange={(event) => updateForm('fraisPayes', event.target.checked)}
                  type="checkbox"
                />
                Frais d’inscription payés
              </label>
              {formError && (
                <div
                  className={`rounded-xl p-3 text-sm ${
                    formErrorType ? 'bg-amber-50 text-amber-900' : 'bg-red-50 text-red-700'
                  }`}
                  role="alert"
                >
                  <p>{formError}</p>
                  {formErrorType === 'notes' && (
                    <>
                      <p className="mt-2">Rien n’a été modifié.</p>
                      {editing && (
                        <button
                          className="mt-2 font-bold underline"
                          onClick={retablirValeursOrigine}
                          type="button"
                        >
                          Rétablir le niveau, l’année et le statut d’origine
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  disabled={saving}
                  onClick={closeModal}
                  type="button"
                >
                  Annuler
                </button>
                <button
                  className="rounded-xl bg-iuc-red px-4 py-2.5 text-sm font-bold text-white hover:bg-iuc-red/90 disabled:opacity-60"
                  disabled={saving || students.length === 0 || levels.length === 0 || years.length === 0}
                  type="submit"
                >
                  {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer l’inscription'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </DashboardLayout>
  )
}

export default Inscriptions
