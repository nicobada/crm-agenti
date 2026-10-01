# 🔐 Demo Accounts & RBAC Permissions Matrix

Questo ambiente di sviluppo/portfolio include un database pre-popolato tramite lo script di seed con account di test coerenti per esplorare la piattaforma con ruoli differenti.

---

## 👥 Account Preconfigurati (Seed)

| Ruolo | Email | Password | Codice Agente | Descrizione |
|---|---|---|---|---|
| **ADMIN / MANAGER** | `admin@crm.local` | `admin123` | *Nessuno* | Controllo totale dell'infrastruttura, configurazione regole provvigionali, gestione agenti e audit trail GDPR. |
| **AGENT** | `agent@crm.local` | `agent123` | `AGT-001` | Agente commerciale per l'area *Nord-Ovest*, provvigione base 10%. Accesso ai propri clienti, ordini e documenti. |

---

## 🛡️ Matrice dei Permessi (Role-Based Access Control)

Il sistema adotta un modello di sicurezza rigoroso sia a livello di autorizzazioni HTTP (NestJS Guards) che a livello di query (Prisma ORM):

| Risorsa / Funzionalità | ADMIN | MANAGER | AGENT | Note di Sicurezza |
|---|:---:|:---:|:---:|---|
| **Login & Profilo** | ✅ | ✅ | ✅ | Autenticazione tramite JWT con verifica stato utente attivo |
| **Anagrafica Clienti** | ✅ Completa | ✅ Completa | 👁️ Lettura / Solo Propri | L'agente visualizza i clienti dell'anagrafica ma associa gli ordini al proprio codice |
| **Anagrafica Agenti** | ✅ Completa | ✅ Completa | ❌ Negato | Gestione codici agente, aliquote base e attivazione/disattivazione |
| **Prodotti & Stock** | ✅ Completa | ✅ Completa | 👁️ Solo Lettura | Gestione catalogo, prezzi base e monitoraggio disponibilità |
| **Ordini di Vendita** | ✅ Tutti | ✅ Tutti | 🔒 Solo Propri | L'agente può creare ordini e avanzare stati solo per i propri clienti |
| **Movimentazione Magazzino**| ✅ Automatica | ✅ Automatica | ✅ Automatica | Al cambio stato ordine lo stock viene scalato/ripristinato in transazione |
| **Regole Provvigionali** | ✅ Completa | ✅ Completa | ❌ Negato | Definizione regole gerarchiche (Prodotto, Cliente, Agente, Globale) |
| **Approvazione Provvigioni**| ✅ Completa | ✅ Completa | ❌ Negato | Solo Admin e Manager possono approvare e liquidare provvigioni |
| **Consultazione Provvigioni**| ✅ Tutte | ✅ Tutte | 🔒 Solo Proprie | Visualizzazione del breakdown analitico per ciascun ordine |
| **Upload Documenti** | ✅ Tutti | ✅ Tutti | 🔒 Solo Propri | Archiviazione gerarchica (`clienti/{id}`, `ordini/{id}`) su S3/Storage locale |
| **Audit Log GDPR** | ✅ Solo Admin | ❌ Negato | ❌ Negato | Tracciamento immutabile di tutte le mutazioni (CREATE, UPDATE, DELETE) |

---

## 🔄 Come Ripopolare il Database Locale

In qualsiasi momento è possibile ripristinare il database allo stato pulito con le credenziali iniziali:

```bash
# Esegui il seeding Prisma
npm run db:seed
```

Se desideri un azzeramento completo delle tabelle prima del seed:

```bash
cd packages/prisma
npx tsx clean-orphaned-data.ts
npm run db:seed
```
