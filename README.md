# AppOut – Backend (NestJS + Prisma)

API do AppOut para **autenticação**, **clientes**, **veículos**, **peças**, **catálogo de serviços**, **ordens de serviço**, **agenda** e **financeiro**.

> Stack: **NestJS**, **Prisma**, **MySQL**, **JWT**.

---

## Requisitos

- Node 18+ (LTS recomendado)
- NPM/Yarn/PNPM
- Banco de dados acessível (ex.: PostgreSQL)
- Arquivo `.env` configurado (veja abaixo)

---

## Configuração

Crie um arquivo `.env` na raiz do backend:

```env
# Porta do HTTP server
PORT=3000

# Prisma (exemplo com MySQL)
DATABASE_URL="mysql://user:password@localhost:3306/appout"

# JWT
JWT_SECRET="uma_chave_secreta_bem_forte"
JWT_EXPIRES_IN="1d"

# CORS (opcional)
CORS_ORIGIN=http://localhost:4200

# SEED (opcional)
SEED_ADMIN_EMAIL=admin@local.com
SEED_ADMIN_PASSWORD=admin123

# instalar deps
npm install

# gerar types do Prisma
npx prisma generate

# criar/rodar migrações
npx prisma migrate dev --name init

# iniciar em dev (hot reload)
npm run start:dev

# build e produção local
npm run build
npm run start:prod

---

## Deploy na Railway

Para produção na Railway, não use `mysql.railway.internal` no seu computador local. Esse host só funciona dentro da rede privada da Railway.

### Variáveis de ambiente

No serviço da aplicação, configure `DATABASE_URL` usando a URL do banco do próprio projeto. Se o banco e a API estiverem no mesmo projeto Railway, use a conexão interna indicada pelo serviço MySQL. Se for rodar o comando fora da Railway, use a URL pública/tcp proxy do banco.

### Migrações

O comando certo para produção é:

```bash
npm run prisma:migrate:deploy
```

Na Railway, a forma mais segura é configurar isso como **Pre-Deploy Command** no serviço da API:

```bash
npm run prisma:migrate:deploy
```

Se quiser executar manualmente dentro do ambiente Railway, use o shell da Railway:

```bash
railway shell
npm run prisma:migrate:deploy
```

Se precisar rodar localmente com as variáveis do serviço Railway, use:

```bash
railway run npm run prisma:migrate:deploy
```

> Dica: no serviço MySQL da Railway, use a variável `MYSQL_URL` como base para o `DATABASE_URL` da API.

### Start command

O backend inicia com:

```bash
npm run start:prod
```
