const API_URL = 'http://localhost:3001'

export type Category = {
  id: string
  name: string
  color: string
}

export type CategoryInput = Omit<Category, 'id'>

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function getCategories(token: string): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Erro ao carregar categorias')
  return res.json() as Promise<Category[]>
}

export async function createCategory(token: string, data: CategoryInput): Promise<Category> {
  const res = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erro ao criar categoria')
  return res.json() as Promise<Category>
}

export async function updateCategory(
  token: string,
  id: string,
  data: CategoryInput,
): Promise<Category> {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erro ao atualizar categoria')
  return res.json() as Promise<Category>
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Erro ao deletar categoria')
}
