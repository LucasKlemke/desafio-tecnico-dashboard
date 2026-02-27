import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductsPage } from '../ProductsPage'
import * as productsService from '@/services/products'
import * as categoriesService from '@/services/categories'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token', user: { id: '1', name: 'Teste', email: 'a@a.com' } }),
}))

const mockCategories = [
  { id: '1', name: 'Eletrônicos', color: '#3b82f6' },
  { id: '2', name: 'Informática', color: '#8b5cf6' },
]

const mockProducts = [
  { id: '1', name: 'iPhone 15 Pro', price: 7999.9, categoryId: '1', stock: 10 },
  { id: '2', name: 'MacBook Air M2', price: 10500, categoryId: '2', stock: 5 },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

function setupDefaultMocks() {
  vi.spyOn(productsService, 'getProducts').mockResolvedValue(mockProducts)
  vi.spyOn(categoriesService, 'getCategories').mockResolvedValue(mockCategories)
}

describe('ProductsPage', () => {
  it('exibe estado de carregamento inicialmente', () => {
    setupDefaultMocks()

    render(<ProductsPage />)

    expect(screen.getByText('Carregando produtos...')).toBeInTheDocument()
  })

  it('renderiza a tabela com os produtos', async () => {
    setupDefaultMocks()

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
      expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
    })
  })

  it('exibe o nome da categoria na tabela', async () => {
    setupDefaultMocks()

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('Eletrônicos')).toBeInTheDocument()
    })
  })

  it('exibe mensagem de erro quando getProducts falha', async () => {
    vi.spyOn(productsService, 'getProducts').mockRejectedValue(
      new Error('Erro ao carregar produtos'),
    )
    vi.spyOn(categoriesService, 'getCategories').mockResolvedValue([])

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar produtos')).toBeInTheDocument()
    })
  })

  it('abre o modal ao clicar em "Novo Produto"', async () => {
    setupDefaultMocks()
    const user = userEvent.setup()

    render(<ProductsPage />)

    await waitFor(() => screen.getByText('iPhone 15 Pro'))

    await user.click(screen.getByRole('button', { name: /novo produto/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('field-name')).toBeInTheDocument()
  })

  it('o dropdown de categorias exibe as categorias disponíveis', async () => {
    setupDefaultMocks()
    const user = userEvent.setup()

    render(<ProductsPage />)

    await waitFor(() => screen.getByText('iPhone 15 Pro'))

    await user.click(screen.getByRole('button', { name: /novo produto/i }))

    const select = screen.getByTestId('field-category') as HTMLSelectElement
    expect(select.options).toHaveLength(3) // "Sem categoria" + 2 categorias
    expect(select.options[1].text).toBe('Eletrônicos')
    expect(select.options[2].text).toBe('Informática')
  })

  it('cria um novo produto e o exibe na tabela', async () => {
    setupDefaultMocks()
    const newProduct = { id: '99', name: 'Dell XPS', price: 12000, categoryId: '2', stock: 3 }
    vi.spyOn(productsService, 'createProduct').mockResolvedValue(newProduct)
    const user = userEvent.setup()

    render(<ProductsPage />)

    await waitFor(() => screen.getByText('iPhone 15 Pro'))

    await user.click(screen.getByRole('button', { name: /novo produto/i }))
    await user.clear(screen.getByTestId('field-name'))
    await user.type(screen.getByTestId('field-name'), 'Dell XPS')
    await user.clear(screen.getByTestId('field-price'))
    await user.type(screen.getByTestId('field-price'), '12000')
    await user.clear(screen.getByTestId('field-stock'))
    await user.type(screen.getByTestId('field-stock'), '3')
    await user.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => {
      expect(screen.getByText('Dell XPS')).toBeInTheDocument()
    })
  })

  it('abre o modal de edição com os dados do produto preenchidos', async () => {
    setupDefaultMocks()
    const user = userEvent.setup()

    render(<ProductsPage />)

    await waitFor(() => screen.getByText('iPhone 15 Pro'))

    await user.click(screen.getByRole('button', { name: /editar iphone 15 pro/i }))

    expect((screen.getByTestId('field-name') as HTMLInputElement).value).toBe('iPhone 15 Pro')
    expect((screen.getByTestId('field-category') as HTMLSelectElement).value).toBe('1')
  })

  it('atualiza o produto na tabela após edição', async () => {
    setupDefaultMocks()
    const updated = { ...mockProducts[0], name: 'iPhone 16 Pro' }
    vi.spyOn(productsService, 'updateProduct').mockResolvedValue(updated)
    const user = userEvent.setup()

    render(<ProductsPage />)

    await waitFor(() => screen.getByText('iPhone 15 Pro'))

    await user.click(screen.getByRole('button', { name: /editar iphone 15 pro/i }))
    await user.clear(screen.getByTestId('field-name'))
    await user.type(screen.getByTestId('field-name'), 'iPhone 16 Pro')
    await user.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => {
      expect(screen.getByText('iPhone 16 Pro')).toBeInTheDocument()
      expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument()
    })
  })

  it('remove o produto da tabela após exclusão confirmada', async () => {
    setupDefaultMocks()
    vi.spyOn(productsService, 'deleteProduct').mockResolvedValue()
    const user = userEvent.setup()

    render(<ProductsPage />)

    await waitFor(() => screen.getByText('iPhone 15 Pro'))

    await user.click(screen.getByRole('button', { name: /deletar iphone 15 pro/i }))
    await user.click(screen.getByRole('button', { name: /^excluir$/i }))

    await waitFor(() => {
      expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument()
    })
  })

  it('mantém o produto na tabela ao cancelar exclusão', async () => {
    setupDefaultMocks()
    const user = userEvent.setup()

    render(<ProductsPage />)

    await waitFor(() => screen.getByText('iPhone 15 Pro'))

    await user.click(screen.getByRole('button', { name: /deletar iphone 15 pro/i }))
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
  })
})
