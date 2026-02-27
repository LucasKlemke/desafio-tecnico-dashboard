import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoriesPage } from '../CategoriesPage'
import * as categoriesService from '@/services/categories'
import * as productsService from '@/services/products'

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
  { id: '3', name: 'Dell XPS 13', price: 12000, categoryId: '2', stock: 5 },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

function setupDefaultMocks() {
  vi.spyOn(categoriesService, 'getCategories').mockResolvedValue(mockCategories)
  vi.spyOn(productsService, 'getProducts').mockResolvedValue(mockProducts)
}

describe('CategoriesPage', () => {
  it('exibe estado de carregamento inicialmente', () => {
    setupDefaultMocks()

    render(<CategoriesPage />)

    expect(screen.getByText('Carregando categorias...')).toBeInTheDocument()
  })

  it('renderiza a tabela com as categorias', async () => {
    setupDefaultMocks()

    render(<CategoriesPage />)

    await waitFor(() => {
      expect(screen.getByText('Eletrônicos')).toBeInTheDocument()
      expect(screen.getByText('Informática')).toBeInTheDocument()
    })
  })

  it('exibe a contagem de produtos por categoria', async () => {
    setupDefaultMocks()

    render(<CategoriesPage />)

    await waitFor(() => {
      expect(screen.getByText('1 produto')).toBeInTheDocument()
      expect(screen.getByText('2 produtos')).toBeInTheDocument()
    })
  })

  it('exibe mensagem de erro quando getCategories falha', async () => {
    vi.spyOn(categoriesService, 'getCategories').mockRejectedValue(
      new Error('Erro ao carregar categorias'),
    )
    vi.spyOn(productsService, 'getProducts').mockResolvedValue([])

    render(<CategoriesPage />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar categorias')).toBeInTheDocument()
    })
  })

  it('abre o modal ao clicar em "Nova Categoria"', async () => {
    setupDefaultMocks()
    const user = userEvent.setup()

    render(<CategoriesPage />)

    await waitFor(() => screen.getByText('Eletrônicos'))

    await user.click(screen.getByRole('button', { name: /nova categoria/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('field-cat-name')).toBeInTheDocument()
  })

  it('cria nova categoria e a exibe na tabela', async () => {
    setupDefaultMocks()
    const newCat = { id: '3', name: 'Acessórios', color: '#f59e0b' }
    vi.spyOn(categoriesService, 'createCategory').mockResolvedValue(newCat)
    const user = userEvent.setup()

    render(<CategoriesPage />)

    await waitFor(() => screen.getByText('Eletrônicos'))

    await user.click(screen.getByRole('button', { name: /nova categoria/i }))
    await user.clear(screen.getByTestId('field-cat-name'))
    await user.type(screen.getByTestId('field-cat-name'), 'Acessórios')
    await user.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => {
      expect(screen.getByText('Acessórios')).toBeInTheDocument()
    })
  })

  it('abre o modal de edição com os dados preenchidos', async () => {
    setupDefaultMocks()
    const user = userEvent.setup()

    render(<CategoriesPage />)

    await waitFor(() => screen.getByText('Eletrônicos'))

    await user.click(screen.getByRole('button', { name: /editar eletrônicos/i }))

    expect((screen.getByTestId('field-cat-name') as HTMLInputElement).value).toBe('Eletrônicos')
  })

  it('atualiza a categoria na tabela após edição', async () => {
    setupDefaultMocks()
    const updated = { id: '1', name: 'Eletrônicos Pro', color: '#3b82f6' }
    vi.spyOn(categoriesService, 'updateCategory').mockResolvedValue(updated)
    const user = userEvent.setup()

    render(<CategoriesPage />)

    await waitFor(() => screen.getByText('Eletrônicos'))

    await user.click(screen.getByRole('button', { name: /editar eletrônicos/i }))
    await user.clear(screen.getByTestId('field-cat-name'))
    await user.type(screen.getByTestId('field-cat-name'), 'Eletrônicos Pro')
    await user.click(screen.getByRole('button', { name: /^salvar$/i }))

    await waitFor(() => {
      expect(screen.getByText('Eletrônicos Pro')).toBeInTheDocument()
      expect(screen.queryByText('Eletrônicos')).not.toBeInTheDocument()
    })
  })

  it('exibe aviso com contagem ao tentar excluir categoria com produtos', async () => {
    setupDefaultMocks()
    const user = userEvent.setup()

    render(<CategoriesPage />)

    await waitFor(() => screen.getByText('Eletrônicos'))

    await user.click(screen.getByRole('button', { name: /deletar eletrônicos/i }))

    await waitFor(() => {
      expect(screen.getByTestId('delete-warning')).toBeInTheDocument()
      expect(screen.getByTestId('delete-warning')).toHaveTextContent(
        '1 produto ficará sem categoria',
      )
    })
  })

  it('não exibe aviso quando categoria não tem produtos', async () => {
    vi.spyOn(categoriesService, 'getCategories').mockResolvedValue([
      ...mockCategories,
      { id: '3', name: 'Vazia', color: '#000000' },
    ])
    vi.spyOn(productsService, 'getProducts').mockResolvedValue(mockProducts)
    const user = userEvent.setup()

    render(<CategoriesPage />)

    await waitFor(() => screen.getByText('Vazia'))

    await user.click(screen.getByRole('button', { name: /deletar vazia/i }))

    expect(screen.queryByTestId('delete-warning')).not.toBeInTheDocument()
  })

  it('remove a categoria e desvincula os produtos após exclusão', async () => {
    setupDefaultMocks()
    vi.spyOn(categoriesService, 'deleteCategory').mockResolvedValue()
    vi.spyOn(productsService, 'patchProduct').mockResolvedValue({
      id: '1',
      name: 'iPhone 15 Pro',
      price: 7999.9,
      categoryId: null,
      stock: 10,
    })
    const user = userEvent.setup()

    render(<CategoriesPage />)

    await waitFor(() => screen.getByText('Eletrônicos'))

    await user.click(screen.getByRole('button', { name: /deletar eletrônicos/i }))
    await user.click(screen.getByRole('button', { name: /^excluir$/i }))

    await waitFor(() => {
      expect(screen.queryByText('Eletrônicos')).not.toBeInTheDocument()
    })

    expect(productsService.patchProduct).toHaveBeenCalledWith('test-token', '1', {
      categoryId: null,
    })
  })

  it('mantém a categoria ao cancelar exclusão', async () => {
    setupDefaultMocks()
    const user = userEvent.setup()

    render(<CategoriesPage />)

    await waitFor(() => screen.getByText('Eletrônicos'))

    await user.click(screen.getByRole('button', { name: /deletar eletrônicos/i }))
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(screen.getByText('Eletrônicos')).toBeInTheDocument()
  })
})
