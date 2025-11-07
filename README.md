# AppOut – Backend (NestJS + Prisma)

API do AppOut para **autenticação**, **clientes**, **veículos**, **peças**, **catálogo de serviços**, **ordens de serviço** e **agenda**.

> Stack: **NestJS**, **Prisma**, **PostgreSQL** (ou outro banco compatível com Prisma), **JWT**.

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

# Prisma (exemplo com PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/appout?schema=public"

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