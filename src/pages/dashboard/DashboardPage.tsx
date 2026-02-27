import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getProducts } from '@/services/products'
import { getCategories } from '@/services/categories'

export function DashboardPage() {
  const { user, token } = useAuth()
  const [totalProducts, setTotalProducts] = useState<number | null>(null)
  const [totalCategories, setTotalCategories] = useState<number | null>(null)
  const [totalStock, setTotalStock] = useState<number | null>(null)
  const [avgPrice, setAvgPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    Promise.all([getProducts(token), getCategories(token)])
      .then(([products, categories]) => {
        setTotalProducts(products.length)
        setTotalCategories(categories.length)
        setTotalStock(products.reduce((sum, p) => sum + p.stock, 0))
        setAvgPrice(
          products.length > 0
            ? products.reduce((sum, p) => sum + p.price, 0) / products.length
            : 0,
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const stats = [
    { label: 'Total de Produtos', value: loading ? '—' : totalProducts },
    { label: 'Categorias', value: loading ? '—' : totalCategories },
    { label: 'Itens em Estoque', value: loading ? '—' : totalStock },
    {
      label: 'Preço Médio',
      value:
        loading || avgPrice === null
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
