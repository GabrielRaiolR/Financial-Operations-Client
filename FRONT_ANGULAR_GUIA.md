# Guia Angular — Financial Operations Web (FinOps)

Documentação técnica do frontend **Angular 21** (standalone components, lazy routes). Complementa o backend descrito no repositório **financial-operations-system** e no `MANUAL_IMPLEMENTACAO.md`.

---

## 1. Stack e arranque

- **Angular CLI** 21.x; **TypeScript** estrito.
- **Servidor de desenvolvimento:** `ng serve` (por defeito `http://localhost:4200/`).
- **API:** `environment.apiUrl` — em desenvolvimento (`environment.development.ts`) usa **`/api`** (proxy ou gateway local); produção aponta para o host real.

---

## 2. Estrutura de pastas (resumo)

| Área | Caminho | Notas |
|------|---------|--------|
| Rotas raiz | `src/app/app.routes.ts` | Redireciona `''` → `dashboard`; wildcard → `dashboard`. |
| Auth | `src/app/features/auth/` | Login, registo, rotas lazy `AUTH_ROUTES`. |
| Dashboard | `src/app/features/dashboard/` | Painel após login. |
| Ordens | `src/app/features/financial-orders/` | Lista, criação, filtros; integração com approve/reject. |
| Utilizadores | `src/app/features/users/` | Só **ADMIN** (`roleGuard` + `data.roles`). |
| Core | `src/app/core/` | `AuthService`, guards, interceptors, modelos partilhados. |

---

## 3. Autenticação e papéis

- **`AuthService`** (`core/services/auth.service.ts`): guarda token em `sessionStorage`, extrai do JWT as claims **`sub`**, **`companyId`**, **`email`** (ou equivalentes) e **`role`**.
- **`role`** exposto à UI: **`'ADMIN' \| 'FINANCE' \| null`**, alinhado ao enum do backend.
- **`app`**: usa `state$` / sinais para email, papel e `isAdmin` onde necessário na shell (sidebar, cabeçalho).

### 3.1. Guards

- **`authGuard`**: exige sessão com token.
- **`roleGuard`**: lê `route.data['roles']`; se o papel do utilizador não estiver na lista, redireciona para **`/dashboard`**.  
  Exemplo: **`/users`** → `data: { roles: ['ADMIN'] }`.

---

## 4. Ordens financeiras e separação ADMIN / FINANCE

Ficheiro principal: **`features/financial-orders/pages/orders-list-page.component.ts`**.

### 4.1. O que cada papel faz na UI

| Papel | Criar ordem | Listar / filtrar | Aprovar / rejeitar |
|-------|-------------|------------------|---------------------|
| **ADMIN** | Sim | Sim | Sim — botões **Aprovar** e **Rejeitar** em linhas com `status === 'PENDING'`. |
| **FINANCE** | Sim | Sim | Não — a coluna **Acções** mostra texto neutro (classe `muted`) em vez dos botões; o backend devolve **403** se alguém contornar a UI. |

### 4.2. Implementação no componente

- Injeta-se **`AuthService`** como **`protected auth`** para o template aceder a **`auth.role`**.
- Condicional no template:
  - **`item.status === 'PENDING'`** e **`auth.role === 'ADMIN'`** → `<div class="row-actions row-actions--orders">` com **dois** botões empilhados (**Aprovar**, **Rejeitar**), largura total na célula, para **nunca** cortar a segunda acção em ecrãs estreitos; a tabela está dentro de **`.orders-table-scroll`** (`overflow-x: auto`) e a célula **Acções** tem **`min-width`** + **`white-space: nowrap`**.
  - **`item.status === 'PENDING'`** e **`auth.role !== 'ADMIN'`** → mensagem informativa (ex.: *Aguardando aprovação*), sem chamadas a `approve`/`reject`.
- **`approve(id)`** — `POST .../approve` com corpo `{}`.
- **`reject(id)`** — abre **`window.prompt`** para motivo **opcional**; **Cancelar** no prompt **não** chama a API; **OK** com texto vazio envia `POST .../reject` com corpo `{}`; com texto, envia `{ "reason": "..." }` (alinhado a **`RejectFinancialOrderRequest`** no backend).

### 4.3. API chamada pelo serviço

- **`FinancialOrdersApiService`**: `POST .../financial-orders/{id}/approve` e `POST .../financial-orders/{id}/reject` (este último com corpo opcional **`{ reason?: string }`**).
- No servidor, estes endpoints estão protegidos com **`@PreAuthorize("hasRole('ADMIN')")`**. A UI apenas evita cliques inúteis e confusão; a **fonte de verdade** é a API.

---

## 5. Gestão de utilizadores

- **`UsersListPageComponent`**: CRUD administrativo; **`companyName`** (e `companyId`) vêm do **`UserResponse`** em `GET /users` quando o backend envia o campo.
- Acesso: apenas **ADMIN** via **`roleGuard`**.

---

## 6. Boas práticas ao evoluir o projeto

- Novos ecrãs sensíveis a papel: preferir **`roleGuard`** + `data.roles` a espalhar `if (role)` só no template.
- Para acções que mudam estado crítico (aprovação, permissões), manter **mesma regra** no backend e refletir na UI (ocultar ou desactivar) para boa UX.
- Após alterar claims do JWT no backend, fazer **login de novo** — o Angular só relê o papel a partir do token actual.

---

## 7. Referências cruzadas

- **Backend — papéis e approve/reject:** `financial-operations-system/README.md` e `MANUAL_IMPLEMENTACAO.md` (§15.5).
- **UX copy e padrões visuais:** `FRONTEND_DESIGN_UX.md`.
