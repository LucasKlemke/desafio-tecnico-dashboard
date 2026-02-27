import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../products'

const TOKEN = 'test-token'

const mockProduct = {
  id: '1',
  name: 'iPhone 15 Pro',
  price: 7999.9,
  categoryId: '1' as string | null,
  stock: 10,
}

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

describe('getProducts', () => {
  it('retorna lista de produtos em caso de sucesso', async () => {
    mockFetch([mockProduct])

    const result = await getProducts(TOKEN)

    expect(result).toEqual([mockProduct])
  })

  it('envia o token de autorização', async () => {
    const spy = mockFetch([mockProduct])

    await getProducts(TOKEN)

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/products'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
      }),
    )
  })

  it('lança erro quando a resposta não é ok', async () => {
    mockFetch({}, false, 500)

    await expect(getProducts(TOKEN)).rejects.toThrow('Erro ao carregar produtos')
  })
})

describe('createProduct', () => {
  const input = { name: 'Novo', price: 100, categoryId: '1' as string | null, stock: 5 }

  it('retorna o produto criado', async () => {
    mockFetch({ id: '99', ...input })

    const result = await createProduct(TOKEN, input)

    expect(result).toEqual({ id: '99', ...input })
  })

  it('faz requisição POST com os dados corretos', async () => {
    const spy = mockFetch({ id: '99', ...input })

    await createProduct(TOKEN, input)

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/products'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(input),
      }),
    )
  })

  it('lança erro quando a resposta não é ok', async () => {
    mockFetch({}, false, 422)

    await expect(createProduct(TOKEN, input)).rejects.toThrow('Erro ao criar produto')
  })
})

describe('updateProduct', () => {
  const input = { name: 'Editado', price: 200, categoryId: '2' as string | null, stock: 3 }

  it('retorna o produto atualizado', async () => {
    mockFetch({ id: '1', ...input })

    const result = await updateProduct(TOKEN, '1', input)

    expect(result).toEqual({ id: '1', ...input })
  })

  it('faz requisição PUT na URL correta', async () => {
    const spy = mockFetch({ id: '1', ...input })

    await updateProduct(TOKEN, '1', input)

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/products/1'),
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('lança erro quando a resposta não é ok', async () => {
    mockFetch({}, false, 404)

    await expect(updateProduct(TOKEN, '1', input)).rejects.toThrow('Erro ao atualizar produto')
  })
})

describe('deleteProduct', () => {
  it('resolve sem retorno em caso de sucesso', async () => {
    mockFetch(null)

    await expect(deleteProduct(TOKEN, '1')).resolves.toBeUndefined()
  })

  it('faz requisição DELETE na URL correta', async () => {
    const spy = mockFetch(null)

    await deleteProduct(TOKEN, '1')

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/products/1'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('lança erro quando a resposta não é ok', async () => {
    mockFetch({}, false, 404)

    await expect(deleteProduct(TOKEN, '1')).rejects.toThrow('Erro ao deletar produto')
  })
})
