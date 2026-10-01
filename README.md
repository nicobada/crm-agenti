# 🏢 CRM Agenti & Provvigioni — Enterprise Monorepo

[![CI Pipeline](https://github.com/nicobada/crm-agenti/actions/workflows/ci.yml/badge.svg)](https://github.com/nicobada/crm-agenti/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![NestJS](https://img.shields.io/badge/NestJS-10.3-red?logo=nestjs)
![Prisma](https://img.shields.io/badge/Prisma-5.14-blue?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

Piattaforma CRM B2B full-stack di livello enterprise per la gestione integrata della rete commerciale: anagrafica clienti, ordini di vendita con movimentazione atomica del magazzino, motore provvigionale gerarchico multi-livello a regole concorrenti, archiviazione documentale ibrida S3/Locale e audit trail GDPR.

---

## ⚡ Demo & Preview

- **Live Application:** [Demo Live su Vercel/Railway](https://crm-agenti-demo.up.railway.app) *(Link placeholder per deploy portfolio)*
- **Dashboard Preview:** `docs/assets/preview.gif`

---

## 🔐 Credenziali Demo (Seed Preconfigurato)

Il database di test locale include utenti preconfigurati con ruoli e visibilità differenziate:

| Ruolo | Email | Password | Accesso e Privilegi |
|---|---|---|---|
| **ADMIN / MANAGER** | `admin@crm.local` | `admin123` | Accesso completo: gestione agenti, cataloghi prodotti, approvazione e pagamento provvigioni, Audit Log GDPR |
| **AGENT** | `agent@crm.local` | `agent123` | Portale agente (`AGT-001`): creazione ordini, caricamento documenti, consultazione clienti e proprie provvigioni |

> Per il dettaglio completo della matrice dei permessi consulta [DEMO_CREDENTIALS.md](DEMO_CREDENTIALS.md).

---

## 🏗️ Architettura & Scelte Tecniche

Il progetto è strutturato come **Monorepo gestito con Turborepo**, garantendo separazione modulare tra frontend, backend e data layer, condivisione delle dipendenze e pipeline di build ottimizzate.

```
crm-agenti/
├── .github/workflows/    # CI/CD Pipeline (Lint, Typecheck, Test, Build)
├── apps/
│   ├── api/              # Backend REST con NestJS 10, Passport JWT, Multer
│   └── web/              # Frontend Dashboard con Next.js 14 (App Router) & Tailwind CSS
├── packages/
│   └── prisma/           # Data layer unificato: Schema Prisma, Migrazioni, Seed e Client
├── docker-compose.yml    # Infrastruttura locale containerizzata (PostgreSQL 16 + MinIO S3)
└── turbo.json            # Orchestrazione pipeline e task monorepo
```

### Perché questo stack?
- **NestJS 10 (Backend):** Architettura ad iniezione delle dipendenze, DTO con validazione automatica (`class-validator`), interceptor per audit log e exception filter centralizzati.
- **Next.js 14 App Router (Frontend):** Interfaccia moderna con Tailwind CSS, React Query (`@tanstack/react-query`) per la sincronizzazione ottimistica dello stato server e TanStack Table per reportistica ad alte prestazioni.
- **Prisma ORM & PostgreSQL 16:** Schema tipizzato end-to-end con migrazioni dichiarative e transazioni ACID (`$transaction`) per movimentazioni di magazzino e calcolo provvigioni.
- **Archiviazione Ibrida S3 / Locale:** Storage Service flessibile compatibile con AWS S3 / MinIO e fallback trasparente su filesystem locale per ambienti di sviluppo offline.

---

## 🧠 Business Logic & Algoritmi Chiave

### 1. Motore Provvigionale Gerarchico a Priorità
Il calcolo delle provvigioni (`CommissionCalculationService`) adotta un algoritmo di matching su base regole con priorità decrescente:
1. **Priorità 100 — Regola Prodotto:** Percentuale specifica definita sul singolo articolo dell'ordine.
2. **Priorità 80 — Regola Cliente:** Accordo contrattuale concordato con il cliente finale.
3. **Priorità 50 — Regola Agente:** Incentivo o aliquota target assegnata al singolo agente.
4. **Priorità 0 — Regola Globale:** Minimo garantito di fallback aziendale.
5. **Default — Aliquota Base Agente:** Aliquota standard registrata nell'anagrafica agente (`Agent.commissionRate`).

Include inoltre la gestione di soglie minime e massime di provvigione (`minAmount` / `maxAmount`) e report di calcolo con breakdown per singolo articolo.

### 2. Gestione Transazionale dello Stock
Quando lo stato di un ordine avanza a `CONFIRMED` o successivi, la disponibilità a magazzino degli articoli collegati viene scalata atomicamente all'interno di una transazione Prisma. In caso di annullamento (`CANCELLED`), le giacenze vengono ripristinate automaticamente.

### 3. Sicurezza RBAC & Data Ownership
Gli agenti commerciali hanno visibilità in lettura e scrittura esclusivamente sui propri ordini, documenti e provvigioni, garantita a livello di guardie HTTP NestJS (`JwtAuthGuard`, `RolesGuard`, `OwnershipGuard`) e a livello di filtri query Prisma nel service layer.

---

## 🚀 Quickstart Locale (3 Passaggi)

### Prerequisiti
- **Node.js** 20+ e **npm** 10+
- **Docker** e Docker Compose

```bash
# 1. Clona il repository e installa le dipendenze
git clone https://github.com/nicobada/crm-agenti.git
cd crm-agenti
npm install

# 2. Configura le variabili d'ambiente e avvia il database
cp .env.example .env
docker compose up -d

# 3. Esegui le migrazioni, popola il database e avvia l'app
npm run db:migrate
npm run db:seed
npm run dev
```

- **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)
- **MinIO Console (Opzionale):** [http://localhost:9001](http://localhost:9001) (`minio` / `minio123`)

---

## 🧪 Test & Qualità del Codice

```bash
# Esegui typecheck su tutti i package del monorepo
npm run lint

# Esegui la suite di test unitari automatizzati
npm run test

# Verifica la build di produzione per tutti i package
npm run build
```

---

## 🛡️ API Reference Principale

| Metodo | Endpoint | Ruolo Richiesto | Descrizione |
|---|---|---|---|
| `POST` | `/api/auth/login` | Pubblico | Autenticazione e generazione JWT |
| `GET` | `/api/agents` | ADMIN, MANAGER | Elenco agenti con metriche di performance |
| `GET` | `/api/clients` | Tutti | Elenco clienti (filtrato per agente se ruolo AGENT) |
| `POST` | `/api/clients` | Tutti | Creazione anagrafica cliente |
| `POST` | `/api/orders` | Tutti | Creazione ordine e calcolo provvigioni |
| `PATCH`| `/api/orders/:id/status`| Tutti | Avanzamento stato ordine e aggiornamento stock |
| `GET` | `/api/commissions` | Tutti | Elenco provvigioni maturate |
| `PATCH`| `/api/commissions/:id/pay`| ADMIN, MANAGER | Liquidazione provvigione |
| `POST` | `/api/documents/upload` | Tutti | Upload documento su S3/Storage locale |
| `GET` | `/api/logs` | ADMIN | Consultazione Audit Log GDPR |

---

## 📄 Licenza

Rilasciato sotto licenza MIT.
