import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductsPage } from '../ProductsPage'
import * as productsService from '@/services/products'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token', user: { id: '1', name: 'Teste', email: 'a@a.com' } }),
}))

const mockProducts = [
  { id: '1', name: 'iPhone 15 Pro', price: 7999.9, category: 'Eletrônicos', stock: 10 },
  { id: '2', name: 'MacBook Air M2', price: 10500, category: 'Informática', stock: 5 },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('ProductsPage', () => {
  it('exibe estado de carregamento inicialmente', () => {
    vi.spyOn(productsService, 'getProducts').mockResolvedValue([])

    render(<ProductsPage />)

    expect(screen.getByText('Carregando produtos...')).toBeInTheDocument()
  })

  it('renderiza a tabela com os produtos', async () => {
    vi.spyOn(productsService, 'getProducts').mockResolvedValue(mockProducts)

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
      expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
    })
  })

  it('exibe mensagem de erro quando getProducts falha', async () => {
    vi.spyOn(productsService, 'getProducts').mockRejectedValue(new Error('Erro ao carregar produtos'))

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar produtos')).toBeInTheDocument()
    })
  })

  it('abre o modal ao clicar em "Novo Produto"', async () => {
    vi.spyOn(productsService, 'getProducts').mockResolvedValue(mockProducts)
    const user = userEvent.setup()

    render(<ProductsPage />)

    await waitFor(() => screen.getByText('iPhone 15 Pro'))

    await user.click(screen.getByRole('button', { name: /novo produto/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('field-name')).toBeInTheDocument()
  })

  it('cria um novo produto e o exibe na tabela', async () => {
    vi.spyOn(productsService, 'getProducts').mockResolvedValue(mockProducts)
    const newProduct = { id: '99', name: 'Dell XPS', price: 12000, category: 'Informática', stock: 3 }
    vi.spyOn(productsService, 'createProduct').mockResolvedValue(newProduct)
    const user = userEvent.setup()

    render(<ProductsPage />)

    await waitFor(() => screen.getByText('iPhone 15 Pro'))

    await user.click(screen.getByRole('button', { name: /novo produto/i }))

    await user.clear(screen.getByTestId('field-name'))
    await user.type(screen.getByTestId('field-name'), 'Dell XPS')
    await user.clear(screen.getByTestId('field-price'))
    await user.type(screen.getByTestId('field-price'), '12000')
    await user.clear(screen.getByTestId('field-category'))
    await user.type(screen.getByTestId('field-category'), 'Informática')
    await user.clear(screen.getByTestId('field-stock'))
    await user.type(screen.getByTestId('field-stock'), '3')

    await user.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => {
      expect(screen.getByText('Dell XPS')).toBeInTheDocument()
    })
  })

  it('abre o modal de edição com os dados do produto preenchidos', async () => {
    vi.spyOn(productsService, 'getProducts').mockResolvedValue(mockProducts)
    const user = userEvent.setup()

    render(<ProductsPage />)

    await waitFor(() => screen.getByText('iPhone 15 Pro'))

    await user.click(screen.getByRole('button', { name: /editar iphone 15 pro/i }))

    expect((screen.getByTestId('field-name') as HTMLInputElement).value).toBe('iPhone 15 Pro')
    expect((screen.getByTestId('field-category') as HTMLInputElement).value).toBe('Eletrônicos')
  })

  it('atualiza o produto na tabela após edição', async () => {
    vi.spyOn(productsService, 'getProducts').mockResolvedValue(mockProducts)
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
    vi.spyOn(productsService, 'getProducts').mockResolvedValue(mockProducts)
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
    vi.spyOn(productsService, 'getProducts').mockResolvedValue(mockProducts)
    const user = userEvent.setup()

    render(<ProductsPage />)

    await waitFor(() => screen.getByText('iPhone 15 Pro'))

    await user.click(screen.getByRole('button', { name: /deletar iphone 15 pro/i }))
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
  })
})
