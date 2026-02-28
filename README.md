# Dashboard Técnico

Dashboard responsivo com autenticação de usuários e CRUD completo de produtos e categorias.

## Como rodar na sua máquina

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

> O arquivo `.env` já vem configurado para desenvolvimento local. Apenas copie o exemplo.

### 3. Rodar o projeto

```bash
npm run fullstack
```

Isso inicia o frontend (porta 5173) e o backend (porta 3001) simultaneamente.

Acesse: [http://localhost:5173](http://localhost:5173)

---

## Testes

### Rodar todos os testes

```bash
npm test
```

### Como foram feitos os testes

Os testes cobrem:

1. **Services** (`src/services/__tests__/`)
   - Testa todas as chamadas à API (produtos e categorias)
   - Usa `msw` para mockar requisições HTTP
   - Valida headers, métodos, payloads e respostas

2. **Componentes/Páginas** (`src/pages/dashboard/__tests__/`)
   - Testa interação do usuário com formulários e tabelas
   - Valida CRUD completo (criar, editar, deletar)
   - Usa `@testing-library/react` e `@testing-library/user-event`
   - Mock de `window.matchMedia` para componentes responsivos

**Bibliotecas:**
- `vitest` — test runner
- `@testing-library/react` — renderizar e testar componentes
- `@testing-library/user-event` — simular interações do usuário
- `msw` — mock de requisições HTTP

---

## Stack

- React 19 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- React Router
- JSON Server (backend simulado)
- JWT para autenticação

## Funcionalidades

- Autenticação (registro/login) com isolamento de dados por usuário  
- CRUD de produtos e categorias  
- Dashboard com gráficos (Recharts)  
- Responsivo (mobile/tablet/desktop)  
- Validação de senha com indicador de força  
- Testes unitários
