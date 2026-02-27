import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  type Category,
  type CategoryInput,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/categories'
import { type Product, getProducts, patchProduct } from '@/services/products'

const EMPTY_FORM: CategoryInput = { name: '', color: '#6366f1' }

export function CategoriesPage() {
  const { token } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!token) return
    void load()
  }, [token])

  async function load() {
    setLoading(true)
    try {
      const [cats, prods] = await Promise.all([getCategories(token!), getProducts(token!)])
      setCategories(cats)
      setProducts(prods)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  function productCountFor(categoryId: string) {
    return products.filter((p) => p.categoryId === categoryId).length
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setForm({ name: category.name, color: category.color })
    setFormOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateCategory(token!, editing.id, form)
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      } else {
        const created = await createCategory(token!, form)
        setCategories((prev) => [...prev, created])
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
      const affected = products.filter((p) => p.categoryId === deleteTarget.id)
      await Promise.all(affected.map((p) => patchProduct(token!, p.id, { categoryId: null })))

      await deleteCategory(token!, deleteTarget.id)

      setProducts((prev) =>
        prev.map((p) => (p.categoryId === deleteTarget.id ? { ...p, categoryId: null } : p)),
      )
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
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
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 size-4" />
          Nova Categoria
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Carregando categorias...</p>}

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
                <th className="px-4 py-3 font-medium">Cor</th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Produtos</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const count = productCountFor(category.id)
                return (
                  <tr key={category.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <span
                        className="inline-block size-5 rounded-full ring-1 ring-inset ring-black/10"
                        style={{ backgroundColor: category.color }}
                        aria-label={`Cor ${category.color}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{category.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {count} {count === 1 ? 'produto' : 'produtos'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${category.name}`}
                          onClick={() => openEdit(category)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Deletar ${category.name}`}
                          onClick={() => setDeleteTarget(category)}
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
      )}

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome</label>
              <input
                data-testid="field-cat-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome da categoria"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex items-center gap-3">
                <input
                  data-testid="field-cat-color"
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-9 w-14 cursor-pointer rounded-md border bg-background p-1"
                />
                <span className="font-mono text-sm text-muted-foreground">{form.color}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => { void handleSave() }}
              disabled={saving || !form.name.trim()}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>

          {deleteTarget && (() => {
            const count = productCountFor(deleteTarget.id)
            return (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Tem certeza que deseja excluir a categoria{' '}
                  <strong className="text-foreground">{deleteTarget.name}</strong>?
                </p>
                {count > 0 && (
                  <p
                    className="rounded-md bg-destructive/10 px-3 py-2 text-destructive"
                    data-testid="delete-warning"
                  >
                    {count} {count === 1 ? 'produto ficará' : 'produtos ficarão'} sem categoria
                    após essa exclusão.
                  </p>
                )}
              </div>
            )
          })()}

          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
