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

export function DashboardPage() {
  const { user, token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setProducts(data as Product[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0)
  const categories = new Set(products.map((p) => p.category)).size
  const avgPrice =
    products.length > 0
      ? products.reduce((sum, p) => sum + p.price, 0) / products.length
      : 0

  const stats = [
    { label: 'Total de Produtos', value: loading ? '—' : products.length },
    { label: 'Categorias', value: loading ? '—' : categories },
    { label: 'Itens em Estoque', value: loading ? '—' : totalStock },
    {
      label: 'Preço Médio',
      value: loading
        ? '—'
        : avgPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
  ]

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Bem-vindo, {user?.name}</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Aqui está um resumo dos seus produtos.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-5">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
