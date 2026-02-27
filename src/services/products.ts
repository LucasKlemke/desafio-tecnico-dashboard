const API_URL = 'http://localhost:3001'

export type Product = {
  id: string
  name: string
  price: number
  categoryId: string | null
  stock: number
}

export type ProductInput = Omit<Product, 'id'>

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function getProducts(token: string): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Erro ao carregar produtos')
  return res.json() as Promise<Product[]>
}

export async function createProduct(token: string, data: ProductInput): Promise<Product> {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erro ao criar produto')
  return res.json() as Promise<Product>
}

export async function updateProduct(
  token: string,
  id: string,
  data: ProductInput,
): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erro ao atualizar produto')
  return res.json() as Promise<Product>
}

export async function patchProduct(
  token: string,
  id: string,
  data: Partial<ProductInput>,
): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erro ao atualizar produto')
  return res.json() as Promise<Product>
}

export async function deleteProduct(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Erro ao deletar produto')
}
