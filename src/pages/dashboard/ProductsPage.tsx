import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import {
  type Product,
  type ProductInput,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/services/products'
import { type Category, getCategories } from '@/services/categories'

const EMPTY_FORM: ProductInput = { name: '', price: 0, categoryId: null, stock: 0 }

export function ProductsPage() {
  const { token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!token) return
    void load()
  }, [token])

  async function load() {
    setLoading(true)
    try {
      const [prods, cats] = await Promise.all([getProducts(token!), getCategories(token!)])
      setProducts(prods)
      setCategories(cats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  function getCategoryById(id: string | null) {
    return categories.find((c) => c.id === id) ?? null
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setForm({
      name: product.name,
      price: product.price,
      categoryId: product.categoryId,
      stock: product.stock,
    })
    setFormOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateProduct(token!, editing.id, form)
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      } else {
        const created = await createProduct(token!, form)
        setProducts((prev) => [...prev, created])
      }
      setFormOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProduct(token!, deleteTarget.id)
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 size-4" />
          Novo Produto
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Carregando produtos...</p>}

      {error && (
        <div className="space-y-1">
          <p className="text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">
            Verifique se o JSON Server está rodando: npm run server
          </p>
        </div>
      )}

      {!loading && !error && (
        products.length === 0 ? (
          <div className="rounded-md border border-dashed bg-muted/30 py-12 text-center">
            <p className="text-muted-foreground">Você ainda não possui nenhum produto.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Clique em &quot;Novo Produto&quot; para adicionar o primeiro.
            </p>
            <Button onClick={openCreate} size="sm" className="mt-4">
              <Plus className="mr-2 size-4" />
              Novo Produto
            </Button>
          </div>
        ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Estoque</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const cat = getCategoryById(product.categoryId)
                return (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{product.id}</td>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3">
                      {product.price.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {cat ? (
                        <CategoryBadge name={cat.name} color={cat.color} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{product.stock}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${product.name}`}
                          onClick={() => openEdit(product)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Deletar ${product.name}`}
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        )
      )}

      {/* Create / Edit dialog */}
      <ResponsiveDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Editar Produto' : 'Novo Produto'}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => { void handleSave() }} disabled={saving || !form.name}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <Field label="Nome">
            <input
              data-testid="field-name"
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome do produto"
            />
          </Field>
          <Field label="Preço">
            <input
              data-testid="field-price"
              className="input"
              type="number"
              min={0}
              step={0.01}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Categoria">
            <select
              data-testid="field-category"
              className="input"
              value={form.categoryId ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value || null }))
              }
            >
              <option value="">Sem categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estoque">
            <input
              data-testid="field-stock"
              className="input"
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
            />
          </Field>
        </div>
      </ResponsiveDialog>

      {/* Delete confirmation dialog */}
      <ResponsiveDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Confirmar exclusão"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => { void handleDelete() }}
              disabled={deleting}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </>
        }
      >
        <p className="py-2 text-sm text-muted-foreground">
          Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Esta ação não
          pode ser desfeita.
        </p>
      </ResponsiveDialog>
    </div>
  )
}

function CategoryBadge({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-black/10">
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}
