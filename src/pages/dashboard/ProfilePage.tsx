import { useAuth } from '@/contexts/AuthContext'

export function ProfilePage() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Perfil</h1>

      <div className="max-w-sm rounded-lg border bg-card p-6 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Nome</p>
          <p className="mt-1 font-medium">{user?.name}</p>
        </div>
        <div className="border-t" />
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
          <p className="mt-1 font-medium">{user?.email}</p>
        </div>
        <div className="border-t" />
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">ID</p>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{user?.id}</p>
        </div>
      </div>
    </div>
  )
}
