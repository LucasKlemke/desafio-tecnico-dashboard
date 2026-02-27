import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../categories'

const TOKEN = 'test-token'

const mockCategory = { id: '1', name: 'Eletrônicos', color: '#3b82f6' }

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('getCategories', () => {
  it('retorna lista de categorias em caso de sucesso', async () => {
    mockFetch([mockCategory])

    const result = await getCategories(TOKEN)

    expect(result).toEqual([mockCategory])
  })

  it('envia o token de autorização', async () => {
    const spy = mockFetch([mockCategory])

    await getCategories(TOKEN)

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/categories'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
      }),
    )
  })

  it('lança erro quando a resposta não é ok', async () => {
    mockFetch({}, false, 500)

    await expect(getCategories(TOKEN)).rejects.toThrow('Erro ao carregar categorias')
  })
})

describe('createCategory', () => {
  const input = { name: 'Informática', color: '#8b5cf6' }

  it('retorna a categoria criada', async () => {
    mockFetch({ id: '2', ...input })

    const result = await createCategory(TOKEN, input)

    expect(result).toEqual({ id: '2', ...input })
  })

  it('faz requisição POST com os dados corretos', async () => {
    const spy = mockFetch({ id: '2', ...input })

    await createCategory(TOKEN, input)

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/categories'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(input),
      }),
    )
  })

  it('lança erro quando a resposta não é ok', async () => {
    mockFetch({}, false, 422)

    await expect(createCategory(TOKEN, input)).rejects.toThrow('Erro ao criar categoria')
  })
})

describe('updateCategory', () => {
  const input = { name: 'Editada', color: '#ef4444' }

  it('retorna a categoria atualizada', async () => {
    mockFetch({ id: '1', ...input })

    const result = await updateCategory(TOKEN, '1', input)

    expect(result).toEqual({ id: '1', ...input })
  })

  it('faz requisição PUT na URL correta', async () => {
    const spy = mockFetch({ id: '1', ...input })

    await updateCategory(TOKEN, '1', input)

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/categories/1'),
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('lança erro quando a resposta não é ok', async () => {
    mockFetch({}, false, 404)

    await expect(updateCategory(TOKEN, '1', input)).rejects.toThrow('Erro ao atualizar categoria')
  })
})

describe('deleteCategory', () => {
  it('resolve sem retorno em caso de sucesso', async () => {
    mockFetch(null)

    await expect(deleteCategory(TOKEN, '1')).resolves.toBeUndefined()
  })

  it('faz requisição DELETE na URL correta', async () => {
    const spy = mockFetch(null)

    await deleteCategory(TOKEN, '1')

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/categories/1'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('lança erro quando a resposta não é ok', async () => {
    mockFetch({}, false, 404)

    await expect(deleteCategory(TOKEN, '1')).rejects.toThrow('Erro ao deletar categoria')
  })
})
