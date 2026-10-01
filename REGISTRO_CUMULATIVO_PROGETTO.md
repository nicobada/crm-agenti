# 📘 Registro Cumulativo e Stato del Progetto CRM Agenti

> **Ultimo aggiornamento:** 21 Settembre 2026  
> **Stato attuale:** ✅ Funzionante e Operativo (Backend API, Frontend Web, Database PostgreSQL, Docker)

Questo documento rappresenta la **fonte unica di verità** sullo stato dell'applicazione, le credenziali di accesso, le configurazioni di sistema, lo storico cronologico di tutte le modifiche e correzioni applicate, e le funzionalità attive.  
*Questo file viene aggiornato dopo ogni modifica funzionante.*

---

## 🚀 1. Panoramica dell'Architettura

Il progetto è strutturato come **Monorepo Turborepo**:
- **Repository GitHub:** `https://github.com/nicobada/crm-agenti.git`
- **Frontend (`apps/web`)**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, React Query (`@tanstack/react-query`).
- **Backend (`apps/api`)**: NestJS 10, Passport.js, JWT, Prisma Service, Multer, Class Validator.
- **Database & ORM (`packages/prisma`)**: Prisma ORM v5, PostgreSQL 16.
- **Containerizzazione**: Docker Compose (`docker-compose.yml`) per PostgreSQL locale.

### Porte di Esecuzione e Servizi
| Servizio | URL / Host | Porta | Note |
|---|---|---|---|
| **Frontend Web** | `http://localhost:3000` | 3000 | Next.js Dev Server |
| **Backend API** | `http://localhost:3001` (`/api`) | 3001 | NestJS REST API |
| **Database PostgreSQL** | `localhost` | 5432 | Container Docker `crm-postgres` |

---

## 🔑 2. Credenziali e Dati di Accesso

### Account Utenti Predefiniti (Seed)
| Ruolo | Email | Password | Note |
|---|---|---|---|
| **Amministratore / Manager** | `admin@crm.local` | `admin123` | Accesso completo a dashboard, agenti, clienti, ordini, log, categorie, attributi |
| **Agente Commerciale** | `agent@crm.local` | `agent123` | Accesso filtrato ai propri clienti, propri ordini, provvigioni |

### Database PostgreSQL
- **Host:** `localhost`
- **Porta:** `5432`
- **Database:** `crm_agenti`
- **Username:** `crm_user`
- **Password:** `crm_password`
- **Connection String (`.env`):**  
  `DATABASE_URL="postgresql://crm_user:crm_password@localhost:5432/crm_agenti?schema=public"`

### JWT Configuration
- **JWT Secret:** `super-secret-jwt-key-change-in-production-2024`
- **Scadenza Token:** 7 giorni

---

## 🛠️ 3. Comandi di Gestione Rapida

### Avvio Database Docker
```bash
docker compose up -d
```

### Avvio Completo dell'Applicazione
```bash
# Avvio di Backend e Frontend contemporaneamente tramite Turborepo:
npm run dev

# Oppure avvio manuale dei singoli workspace:
# Backend API (compilato con metadata per la Dependency Injection di NestJS):
npm --workspace=@crm/api run build
node apps/api/dist/main.js

# Frontend Web:
npm --workspace=@crm/web run dev
```

### Migrazioni e Seed del Database
```bash
# Generazione client Prisma
npm --workspace=@crm/prisma run db:generate

# Esecuzione migrazioni
npm --workspace=@crm/prisma run db:migrate

# Popolamento dati iniziali (Seed con utenti admin e agent)
npm --workspace=@crm/prisma run db:seed
```

---

## 📋 4. Registro Dettagliato di Tutte le Modifiche e Bugfix Applicati

### 4.1. Database e Prisma ORM
1. **Riconciliazione Credenziali `.env`**: Sincronizzato il `.env` di radice e quello del backend per puntare all'istanza Docker (`crm_user` / `crm_password` sul DB `crm_agenti`).
2. **Migrazione `add_categories_and_attributes`**: Generata e applicata la migrazione `20260921171257_add_categories_and_attributes` che ha creato le tabelle mancanti:
   - `Category` (con supporto ad albero gerarchico)
   - `Attribute` e `AttributeValue`
   - `ActivityLog`
   - Campo `categoryId` e FK su `Product`
3. **Correzione Script Seed e Reset**: Aggiunta la chiamata `dotenv.config()` in cima a `seed.ts`, `clean-orphaned-data.ts` e `hard-reset.ts` per evitare fallimenti di connessione Prisma in ambienti standalone.

---

### 4.2. Backend NestJS (`apps/api`)
1. **Risoluzione "Internal server error" al Login (NestJS Dependency Injection)**:
   - *Causa:* L'esecuzione con bundler veloci basati su esbuild (`tsx`) rimuoveva i metadati TypeScript (`design:paramtypes`) richiesti da NestJS per l'iniezione automatica dei service (`validateUser`, `AuthService`, `UsersService`).
   - *Risoluzione:* Configurato il workflow di compilazione con `tsc` / `nest build` preservando `emitDecoratorMetadata: true` ed eseguendo il codice compilato in `dist/main.js`.
2. **Configurazione Compilazione e `rootDir`**:
   - Impostato `"rootDir": "src"` in `apps/api/tsconfig.json` ed escluso `scratch` per garantire una struttura lineare in `dist/` (`dist/main.js`).
   - Disabilitato `"incremental": false` per evitare discrepanze tra la cache `tsbuildinfo` e `deleteOutDir: true` di NestJS.
3. **Integrazione Moduli Mancanti in `AppModule`**:
   - Registrati `CategoriesModule` e `AttributesModule` in `apps/api/src/app.module.ts`.
4. **Supporto `status` in `CreateOrderDto`**:
   - Aggiunto `@IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;` in `CreateOrderDto` per permettere la creazione di ordini già confermati senza violare il `ValidationPipe` restrittivo.
5. **Script `kill-port.js`**: Implementata utility multipiattaforma (`netstat` / `taskkill` per Windows e `lsof` / `kill` per POSIX) per liberare la porta 3001 in caso di processi rimasti orfani.

---

### 4.3. Automazione Stock e Magazzino Ordini (`OrdersService`)
1. **Regola di Scalamento Stock sui Prodotti**:
   - Quando un ordine viene creato o aggiornato verso uno stato operativo (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `INVOICED`, `PAID`), la quantità di ogni prodotto nell'ordine viene **automaticamente detratta dallo stock** (`Product.stock = Math.max(0, currentStock - quantity)`).
2. **Ripristino dello Stock su Annullamento**:
   - Se un ordine che era stato precedentemente confermato o avanzato viene annullato (`CANCELLED`) o reimpostato su `PENDING`, le quantità dei prodotti vengono **automaticamente restituite/incrementate nello stock** (`Product.stock += quantity`).
3. **Transazioni Atomiche Prisma**:
   - La modifica di stato e l'aggiornamento dello stock avvengono all'interno di una transazione Prisma `$transaction`, garantendo coerenza assoluta dei dati.
4. **Log di Attività Integrato**:
   - L'operazione traccia nei log di sistema (`ActivityLog`) il dettaglio del movimento di magazzino associato alla transizione di stato dell'ordine.
5. **Aggiornamento UI in Tempo Reale nel Frontend**:
   - Aggiunta in `apps/web/src/hooks/use-orders.ts` l'invalidazione della cache React Query per `['products']` sia alla creazione dell'ordine sia all'aggiornamento dello stato, così che la lista prodotti e i dettagli mostrino immediatamente il nuovo livello di stock senza dover ricaricare la pagina.
6. **Collaudo Automatizzato**: Verificato con test di integrazione via API:
   - Ordine `PENDING` -> stock invariato (50 -> 50).
   - Ordine passato a `CONFIRMED` -> stock scalato (50 -> 48).
   - Ordine passato a `CANCELLED` -> stock ripristinato (48 -> 50).
   - Ordine creato direttamente come `CONFIRMED` -> stock scalato all'istante (50 -> 45).

---

### 4.4. Frontend Next.js (`apps/web`)
1. **Pulsante "Mostra/Nascondi Password" (Icona Occhio)**:
   - Aggiunto nella pagina di login `apps/web/src/app/login/page.tsx` il toggle con icona `Eye` / `EyeOff` di Lucide per visualizzare o mascherare la password digitata.
2. **Hook `useAuth`**:
   - Risolto il problema di casting e ruoli mancanti: ora restituisce `{ ...query, user, isAdminOrManager, isAdmin }`, permettendo il corretto routing e i controlli sui permessi sia per Admin che per Agenti.
3. **Hook `useProducts`**:
   - Esportate le funzioni hook mancanti che causavano errori di compilazione TypeScript: `useProduct`, `useGenerateVariants`, `useUpdateVariant`, `useDeleteVariant`.
4. **Hook `useCommissions`**:
   - Aggiunto il campo facoltativo `orderNumber?: string` all'interfaccia TypeScript `Commission`.
5. **Componente `OrderItemsTable.tsx`**:
   - Sostituito il vecchio componente ricorsivo errato che tentava di renderizzare l'intera pagina ordini, implementando una tabella pulita per la visualizzazione e modifica delle righe ordine (prodotto, quantità, prezzo unitario, sconto, subtotale).
6. **Componente `OrderDetailModal.tsx`**:
   - Aggiunto supporto compatibile a entrambe le firme delle prop: `open` / `onOpenChange` (standard Radix/Shadcn) e `isOpen` / `onClose`.
7. **Pagine `clients/page.tsx` e `recent-orders.tsx`**:
   - Risolto errore di narrowing TypeScript verificando in sicurezza `Array.isArray(data)` e gestendo correttamente il fallback `{ data: [] }`.
8. **Pulizia File Rotti e Duplicati**:
   - Rimosso il file spazzatura `{` nella cartella `apps/web/src/app/` e il file `layout.js` duplicato rispetto a `layout.tsx`.

### 4.5. Backend API & Risoluzione Route Commissions
1. **Supporto Duale POST/PATCH per Approvazione e Pagamento Provvigioni**:
   - In `apps/api/src/commissions/commissions.controller.ts`, aggiunti i decoratori `@Patch(':id/pay')` e `@Patch(':id/approve')` accanto ai preesistenti `@Post`, garantendo compatibilità universale sia per client REST che per chiamate frontend con metodi HTTP misti.
2. **Collaudo Diagnostico Completo**:
   - Eseguita suite di verifica automatica end-to-end con esito 100% positivo:
     - Login Admin & Agente (`200 OK`)
     - Anagrafica Clienti e assegnazione agente automatica (`200/201 OK`)
     - Rete Agenti e toggle stato attivo/sospeso (`200 OK`)
     - Catalogo Prodotti e prezzi (`200 OK`)
     - Ordini e Ordini Recenti (`200 OK`)
     - Provvigioni con approvazione e liquidazione (`200/201 OK`)
     - Audit Log GDPR (`200 OK`)
3. **Pulizia File Markdown Obsoleti**:
   - Rimossi dalla root del progetto tutti i 16 file markdown storici ridondanti (`BUG_FIX_SUMMARY_v5.md`, `CHANGES_SUMMARY_v5.md`, `CORREZIONI_COMPLETATE.md`, `DEPLOYMENT_GUIDE_v5.md`, `DEPLOYMENT_READY_v5.md`, `FINAL_SUMMARY.md`, `FIXES_COMPLETED_v5.md`, `HANDOVER_AI.md`, `HANDOVER_COMPLETO.md`, `README_FIX*.md`, `README_INSTALL.md`, `agent.md`, `claude.md`).
   - Gli unici file markdown mantenuti sono ora `README.md` e questo registro cumulativo `REGISTRO_CUMULATIVO_PROGETTO.md`.

---

### 4.6. Restyling Grafico Completo & Miglioramenti UI/UX
1. **Nuova Pagina di Login (`/login`)**:
   - Background scuro moderno con aura gradiente smeraldo/teal e sfocature d'atmosfera.
   - Scheda di login in stile glassmorphism (`bg-white/95 backdrop-blur-xl border border-white/10 shadow-2xl`).
   - Icone integrate nei campi (Mail, Lucchetto, Occhio per mostrare/nascondere la password).
   - **Pulsanti di compilazione rapida**: Due pulsanti one-click ("Admin" e "Agente") per precompilare istantaneamente le credenziali senza doverle digitare a mano.
2. **Sidebar di Navigazione (`Sidebar.tsx`)**:
   - Logo rinnovato con badge luminoso a gradiente, icona `Sparkles` e versione "Enterprise v1.0".
   - Voci di navigazione con stato attivo a pillola con ombra morbida (`bg-emerald-600 text-white shadow-sm shadow-emerald-600/30`).
   - Sezione "Azioni Rapide" con collegamenti diretti a nuovo ordine e nuovo cliente.
   - Footer con pulsante di disconnessione pulito ed elegante.
3. **Header Dinamico (`Header.tsx`)**:
   - Titolo e sottotitolo di pagina dinamici che riflettono automaticamente la sezione attuale (es. "Catalogo Prodotti & Listino", "Anagrafica Clienti", "Gestione Ordini").
   - Indicatore di stato del sistema in tempo reale ("Online" con punto verde pulsante).
   - Profilo utente a badge con avatar contenente le iniziali dell'utente, nome/email e pillola colorata del ruolo (Amministratore in rosso tenue, Manager in azzurro, Agente in verde smeraldo).
4. **Dashboard Principale (`/dashboard`)**:
   - Banner Hero con saluto orario contestuale ("Buongiorno/Buon pomeriggio/Buonasera") e data estesa in italiano.
   - Schede statistiche (KPI) con icone a gradiente morbido, sottotitoli descrittivi e micro-animazione al passaggio del mouse (`hover:-translate-y-1 hover:shadow-md`).
   - Componente `RecentOrders` con badge di stato muniti di indicatore a pallino colorato (Confermato = verde smeraldo, In attesa = ambra, Spedito = indaco, In lavorazione = blu, Annullato = rosso).
5. **Gestione Ordini (`/dashboard/orders`)**:
   - Supporto nativo al parametro URL `?new=1` dai collegamenti rapidi della sidebar per aprire immediatamente il form.
   - Visualizzazione in tempo reale della giacenza di magazzino nel menu a tendina dei prodotti (es. `Prodotto Alpha (Stock: 45 pz • € 10.00)`), permettendo a chi inserisce l'ordine di sapere subito la disponibilità residua.
   - Barra dei filtri per stato (Tutti, Confermati, In Attesa, Consegnati, Annullati) e ricerca testuale.
   - Modale di dettaglio ordine (`OrderDetailModal`) rinnovato con riepilogo metriche, righe ordine con subtotali e cambio stato rapido per amministratori.
6. **Anagrafica Clienti (`/dashboard/clients`)**:
   - Supporto all'apertura rapida `?new=1`.
   - Filtri per tipologia cliente (Farmacie, Medici, Cliniche, Ospedali, Distributori).
   - Tabella moderna con recapiti, badge di categoria e indicazione visiva dell'agente assegnato.
7. **Catalogo Prodotti (`/dashboard/products`)**:
   - Badge di giacenza intelligenti con 3 livelli: *Disponibile* (verde), *Scorte Basse* se $\le 10$ pz (ambra), *Esaurito* se $0$ pz (rosso).
   - Modale di creazione e modifica rapida dei prezzi e SKU.
8. **Provvigioni & Compensi (`/dashboard/commissions`)**:
   - Schede riassuntive in testata: Totale Spettanze, In Attesa di Liquidazione, Saldate & Pagate.
   - Filtri a pillola per stato e pulsanti rapidi "Approva" e "Salda".
9. **Audit Log GDPR (`/dashboard/logs`)**:
   - Badge "GDPR Art. 30 Compliant" e pillole colorate per le azioni (Creazione, Cambio Stato, Approvazione, Liquidazione).
10. **Design System & Scrollbar (`globals.css`)**:
    - Scrollbar personalizzata ultra-sottile e discreta.
    - Selezione testo nel tema del brand (`selection:bg-emerald-500 selection:text-white`).

---

## 🔮 5. Suggerimenti e Funzionalità Consigliate (Roadmap)

1. **Controllo Preventivo di Giacenza Minima**:
   - Aggiungere un controllo in fase di checkout/creazione ordine che blocchi o segnali se la quantità richiesta supera lo stock disponibile (`stock < quantity`), con opzione per consentire o meno il sottoscorta.
2. **Notifiche In-App o Email di Ordine Confermato**:
   - Invio automatico di una notifica (email o web push) all'agente e al cliente con il riepilogo dell'ordine e il PDF allegato.
3. **Generazione e Download PDF Ordini**:
   - Implementare un endpoint per generare automaticamente la fattura proforma o bolla d'ordine in PDF stampabile.
4. **Gestione Varianti di Magazzino**:
   - Collegare lo scarico stock non solo al prodotto padre ma alla specifica variante (`ProductVariant`), se l'ordine specifica taglia/colore o attributo.
5. **Esportazione Report e Provvigioni**:
   - Aggiungere pulsanti per scaricare report Excel/CSV su clienti, vendite per periodo e provvigioni liquidate/da liquidare agli agenti.

---
*Documento mantenuto da Antigravity per il progetto CRM Agenti.*
