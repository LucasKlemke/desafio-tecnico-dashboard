import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = 'http://localhost:3001'

type Product = {
  id: string
  name: string
  price: number
  category: string
  stock: number
}

export function ProductsPage() {
  const { token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao carregar produtos')
        return res.json()
      })
      .then((data) => {
        setProducts(data as Product[])
        setError(null)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Erro desconhecido'),
      )
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Produtos</h1>

      {loading && (
        <p className="text-muted-foreground">Carregando produtos...</p>
      )}

      {error && (
        <div className="space-y-1">
          <p className="text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">
            Verifique se o JSON Server está rodando: npm run server
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-md border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Estoque</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{product.id}</td>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">
                    {product.price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td className="px-4 py-3">{product.category}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
