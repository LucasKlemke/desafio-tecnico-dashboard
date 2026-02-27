import { useMemo, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import { getProducts, type Product } from '@/services/products'
import { getCategories } from '@/services/categories'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type StockItem = { name: string; estoque: number; fill: string }
type PriceItem = { name: string; preco: number; fill: string }
type CategoryItem = { name: string; count: number; fill: string }
type TopProduct = Product & { categoryName: string; categoryColor: string }

// Cores padrão usando os tokens oklch que você tem no index.css
const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

export function DashboardPage() {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ products: 0, categories: 0, stock: 0, avgPrice: 0 })
  
  const [stockData, setStockData] = useState<StockItem[]>([])
  const [priceData, setPriceData] = useState<PriceItem[]>([])
  const [categoryData, setCategoryData] = useState<CategoryItem[]>([])
  const [topStockData, setTopStockData] = useState<TopProduct[]>([])

  useEffect(() => {
    if (!token) return
    
    async function loadData() {
      try {
        const [products, categories] = await Promise.all([
          getProducts(token!),
          getCategories(token!)
        ])

        // 1. Cálculos de Stats
        const totalStock = products.reduce((sum, p) => sum + p.stock, 0)
        const avgPrice = products.length > 0 
          ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
          : 0

        setStats({
          products: products.length,
          categories: categories.length,
          stock: totalStock,
          avgPrice
        })

        // 2. Mapeamento de Cores por Categoria
        const categoryColorMap = new Map<string, string>()
        categories.forEach((cat, i) => {
          // Prioriza a cor HEX do banco, senão usa a cor do tema
          categoryColorMap.set(cat.id, cat.color || CHART_COLORS[i % CHART_COLORS.length])
        })

        // 3. Dados do Gráfico de Estoque (Cores por Categoria)
        setStockData(products.map(p => ({
          name: p.name,
          estoque: p.stock,
          fill: categoryColorMap.get(p.categoryId || '') || CHART_COLORS[0]
        })))

        // 4. Dados do Gráfico de Preço (Cor única ou variável)
        setPriceData(products.map(p => ({
          name: p.name,
          preco: p.price,
          fill: 'var(--color-chart-1)' 
        })))

        // 5. Dados do Gráfico de Pizza
        const counts = new Map<string, number>()
        products.forEach(p => {
          const catId = p.categoryId || 'sem-categoria'
          counts.set(catId, (counts.get(catId) || 0) + 1)
        })

        setCategoryData(categories
          .filter(cat => counts.has(cat.id))
          .map((cat) => ({
            name: cat.name,
            count: counts.get(cat.id) || 0,
            fill: categoryColorMap.get(cat.id) || CHART_COLORS[0]
          }))
        )

        // 6. Tabela Top Produtos
        setTopStockData([...products]
          .sort((a, b) => b.stock - a.stock)
          .slice(0, 5)
          .map(p => ({
            ...p,
            categoryName: categories.find(c => c.id === p.categoryId)?.name || 'Outros',
            categoryColor: categoryColorMap.get(p.categoryId || '') || CHART_COLORS[0]
          }))
        )

      } catch (error) {
        console.error("Erro ao carregar dados", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [token])

  // Configurações essenciais para o ChartContainer do Shadcn
  const stockConfig = { estoque: { label: "Estoque" } } satisfies ChartConfig
  const priceConfig = { preco: { label: "Preço", color: "var(--color-chart-1)" } } satisfies ChartConfig
  const categoryConfig = useMemo(() => {
    const config: ChartConfig = { count: { label: "Produtos" } }
    categoryData.forEach(cat => {
      config[cat.name] = { label: cat.name, color: cat.fill }
    })
    return config
  }, [categoryData])

  if (loading) return <div className="p-8 text-center">Carregando dashboard...</div>

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu inventário de {user?.name}.</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.products}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.categories}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.stock}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Estoque - Corrigido para Barras Horizontais Coloridas */}
        <Card>
          <CardHeader><CardTitle>Quantidade em Estoque</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={stockConfig} className="min-h-[200px] w-full">
              <BarChart data={stockData} layout="vertical" margin={{ left: 30, right: 10 }}>
                <CartesianGrid horizontal={false} strokeOpacity={0.2} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="estoque" radius={4}>
                  {stockData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Preço - Corrigido para usar a cor definida no config */}
        <Card>
          <CardHeader><CardTitle>Preço Unitário (R$)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={priceConfig} className="min-h-[200px] w-full">
              <BarChart data={priceData} margin={{ top: 10, left: 10, right: 10 }}>
                <CartesianGrid vertical={false} strokeOpacity={0.2} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="preco" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Corrigido o mapeamento de cores */}
        <Card>
          <CardHeader><CardTitle>Distribuição por Categoria</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={categoryConfig} className="mx-auto aspect-square max-h-[250px]">
              <PieChart>
                <Pie 
                  data={categoryData} 
                  dataKey="count" 
                  nameKey="name" 
                  innerRadius={60} 
                  strokeWidth={2}
                  stroke="var(--background)"
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tabela de Produtos */}
        <Card>
          <CardHeader><CardTitle>Resumo de Produtos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStockData.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex flex-col">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                       <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.categoryColor }} />
                       {p.categoryName}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{p.stock} un.</div>
                    <div className="text-xs text-muted-foreground">
                      {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}