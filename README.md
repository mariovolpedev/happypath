# HappyPath 🌻

**Il social network dei contenuti semplici e felici.**

HappyPath è una piattaforma social tematica in cui gli utenti possono condividere contenuti *semplici e felici* — lontani da violenza, drammi e negatività.

---

## Stack tecnico

| Layer | Tecnologia |
|-------|-----------|
| Backend | Spring Boot 3.2, Java 21, Maven |
| Database | PostgreSQL 16 |
| Sicurezza | Spring Security + JWT (jjwt 0.12) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State management | Zustand |
| Containerizzazione | Docker + Docker Compose |

---

## Avvio rapido

### Con Docker Compose (consigliato)

```bash
git clone <repo>
cd happypath
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Credenziali di default:
  - Admin: `admin` / `Admin1234!`
  - Moderatore: `moderator` / `Mod1234!`

### Sviluppo locale

**Backend:**
```bash
cd backend
# Avvia PostgreSQL (o usa il profilo dev con H2)
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Struttura del progetto

```
happypath/
├── backend/                   # Spring Boot 3
│   └── src/main/java/com/happypath/
│       ├── config/            # SecurityConfig, DataInitializer
│       ├── controller/        # REST controllers
│       ├── dto/               # Request/Response DTOs
│       ├── exception/         # GlobalExceptionHandler
│       ├── model/             # JPA entities
│       ├── repository/        # Spring Data repositories
│       ├── security/          # JWT, UserDetails
│       └── service/           # Business logic
└── frontend/                  # React + TypeScript
    └── src/
        ├── api/               # Axios client + endpoint functions
        ├── components/        # UI components
        ├── hooks/             # Custom React hooks
        ├── pages/             # Page components
        ├── store/             # Zustand state
        └── types/             # TypeScript interfaces
```

---

## API principali

### Autenticazione
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrazione |
| POST | `/api/auth/login` | Login → JWT |

### Contenuti
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/contents` | Feed esplora (paginato, filtrabile per tema) |
| GET | `/api/contents/home` | Feed personalizzato (following) |
| GET | `/api/contents/{id}` | Singolo contenuto |
| POST | `/api/contents` | Crea contenuto 🔒 |
| PUT | `/api/contents/{id}` | Modifica contenuto 🔒 |
| DELETE | `/api/contents/{id}` | Elimina contenuto 🔒 |
| POST | `/api/contents/{id}/reactions` | Reagisci 🔒 |
| GET | `/api/contents/{id}/comments` | Commenti |
| POST | `/api/contents/{id}/comments` | Aggiungi commento 🔒 |

### Utenti
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/users/{username}/profile` | Profilo pubblico |
| PATCH | `/api/users/me` | Aggiorna profilo 🔒 |
| POST | `/api/users/{id}/follow` | Segui utente 🔒 |
| DELETE | `/api/users/{id}/follow` | Smetti di seguire 🔒 |
| GET | `/api/users/search?q=` | Cerca utenti |

### Moderazione (🛡️ MODERATOR/ADMIN)
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/moderation/reports` | Segnalazioni in attesa |
| POST | `/api/moderation/reports/{id}/resolve` | Risolvi segnalazione |
| POST | `/api/moderation/contents/{id}/censor` | Censura contenuto |
| POST | `/api/moderation/users/{id}/ban` | Ban utente |
| POST | `/api/moderation/users/{id}/warn` | Ammonisci utente |

### Admin (👑 ADMIN)
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/admin/bans/{id}/lift` | Revoca ban (decisione finale) |

🔒 = richiede JWT nel header `Authorization: Bearer <token>`

---

## Ruoli utente

| Ruolo | Descrizione |
|-------|-------------|
| `USER` | Utente registrato — accesso completo alla piattaforma |
| `VERIFIED_USER` | Identità verificata con documento (spunta blu ✅). Può creare Alter Ego |
| `MODERATOR` | Gestisce segnalazioni, può censurare/eliminare contenuti e bannare utenti |
| `ADMIN` | Accesso completo. Decisioni finali su ban contestati |

Gli utenti non registrati possono visualizzare tutti i contenuti (link diretto).

