import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCandidatureDocument, retryCandidatureNotification } from './candidatureStaff'

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('./api', () => ({ default: mockApi }))

describe('API du personnel pour les candidatures', () => {
  beforeEach(() => {
    mockApi.get.mockReset()
    mockApi.post.mockReset()
  })

  it('télécharge le document via la route fixe avec le client API authentifié', async () => {
    const content = new Blob(['document'])
    mockApi.get.mockResolvedValue({ data: content })

    await expect(fetchCandidatureDocument('candidate-1', 'document-1')).resolves.toBe(
      content,
    )
    expect(mockApi.get).toHaveBeenCalledWith(
      '/candidatures/candidate-1/documents/document-1/fichier',
      { responseType: 'blob' },
    )
  })

  it('encode les identifiants et relance une notification via le client API', async () => {
    const notification = { id: 'notification-1', statut: 'EN_COURS' }
    mockApi.post.mockResolvedValue({ data: notification })

    await expect(
      retryCandidatureNotification('candidate/1', 'notification-1'),
    ).resolves.toBe(notification)
    expect(mockApi.post).toHaveBeenCalledWith(
      '/candidatures/candidate%2F1/notifications/notification-1/retry',
    )
  })
})
