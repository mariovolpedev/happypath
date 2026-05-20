# HappyPath 🌻

**Il social network dei contenuti semplici e felici.**

HappyPath è una piattaforma social tematica in cui gli utenti possono condividere contenuti *positivi* — lontani da violenza, drammi e negatività. Supporta feed personalizzati, temi, reazioni, commenti, messaggistica privata, alter ego anonimi, notifiche real-time e un sistema completo di moderazione.

---

## Stack tecnico

| Layer | Tecnologia |
|---|---|
| Backend | Spring Boot 3.2, Java 21, Maven |
| Database | PostgreSQL 16 + Flyway (migrazioni) |
| Sicurezza | Spring Security + JWT (jjwt 0.12) |
| Caching | Redis |
| Storage media | MinIO (S3-compatible) |
| WebSocket | Spring STOMP + SockJS |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State management | Zustand (con persist) |
| Containerizzazione | Docker + Docker Compose |
| ORM mapping | MapStruct |

---

## Avvio rapido

### Con Docker Compose (consigliato)

```bash
git clone <repo>
cd happypath
docker compose up --build
```

| Servizio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080/api |
| Actuator health | http://localhost:8080/api/actuator/health *(pubblico)* |
| Actuator metrics/info | http://localhost:8080/api/actuator/* *(Basic Auth richiesto)* |
| MinIO Console | http://localhost:9001 |

**Credenziali di default:**
- Admin: `admin` / `Admin1234!`
- Moderatore: `moderator` / `Mod1234!`

> **⚠️ Sicurezza**: in produzione sovrascrivere sempre le variabili d'ambiente
> `HAPPYPATH_JWT_SECRET`, `ACTUATOR_USER`, `ACTUATOR_PASSWORD`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`.

### Sviluppo locale

**Backend:**
```bash
cd backend
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
├── backend/
│   └── src/main/java/com/happypath/
│       ├── config/            # SecurityConfig, WebSocketConfig, DataInitializer
│       ├── controller/        # REST controllers (18 controller)
│       ├── dto/               # Request/Response DTOs
│       ├── exception/         # GlobalExceptionHandler
│       ├── mapper/            # MapStruct interfaces (entity → DTO)
│       ├── model/             # JPA entities
│       ├── repository/        # Spring Data repositories
│       ├── security/          # JWT filter, UserDetails
│       └── service/           # Business logic
│   └── src/main/resources/
│       └── db/migration/      # Script Flyway (V1__init...)
└── frontend/
    └── src/
        ├── api/               # Axios client + funzioni per ogni endpoint
        ├── components/        # Componenti UI riutilizzabili
        ├── hooks/             # Custom hooks (useNotificationSocket, ...)
        ├── pages/             # Pagine React (17 pagine)
        ├── store/             # Zustand store (auth, notifiche)
        └── types/             # Interfacce TypeScript
```

---

## Funzionalità

### 🔐 Autenticazione & Profilo
- Registrazione con validazione (username univoco, password sicura, data di nascita)
- Login con JWT (access token, 24h)
- Profilo pubblico con avatar, bio, link, followers/following count
- Upload avatar (JPEG/PNG/WebP/GIF, max 5 MB) — archiviato su MinIO
- Modifica profilo (displayName, bio, location, website, avatar)
- Cambio password e cancellazione account dalle impostazioni

### 📝 Contenuti
- Creazione di contenuti con testo (max 500 caratteri), media allegati e tema associato
- Modifica e cancellazione dei propri contenuti
- Pagina di dettaglio contenuto con commenti e reazioni
- Visualizzazione contenuti dell'utente nel profilo (tab dedicata)

### 🏷️ Temi
- Temi predefiniti (preset) e temi custom creati dagli utenti
- Ogni contenuto può essere associato a un tema
- Follow/unfollow di temi
- Filtro per tema nella pagina Esplora
- Emoji personalizzata per ogni tema con picker integrato

### 📰 Feed
- **Feed Home**: contenuti degli utenti e temi seguiti, ordinato per data
- **Feed Esplora**: tutti i contenuti pubblici, filtrabile per tema
- Paginazione infinita (scroll-based) su entrambi i feed
- Preferenze feed personalizzabili (`/api/feed/settings`)

### 💬 Commenti & Reazioni
- Commenti sui contenuti con threading piatto e paginazione
- Reazioni ai contenuti (emoji)
- Reazioni ai commenti
- Cancellazione dei propri commenti

### 🔔 Notifiche
- Notifiche per: nuovo follower, reazione a un contenuto, commento su un contenuto
- Push real-time via WebSocket (STOMP/SockJS) su `/user/queue/notifications`
- Lista notifiche paginata via REST, con badge contatore non letto
- "Segna tutte come lette" con un click
- Persistenza su DB: le notifiche sono disponibili al login anche se l'utente era offline

### 📨 Messaggi privati
- Conversazioni private tra utenti
- Lista conversazioni con anteprima dell'ultimo messaggio
- Invio messaggi, visualizzazione messaggi per conversazione
- Supporto messaggi di testo

### 👤 Alter Ego
- Creazione di un profilo anonimo (Alter Ego) riservato agli utenti verificati ✅
- L'Alter Ego ha nome, avatar e bio indipendenti dall'account principale
- I contenuti pubblicati con l'Alter Ego non sono collegabili all'identità reale
- Profilo pubblico dell'Alter Ego visitabile via `/alter-ego/:id`

### 🔍 Ricerca
- Ricerca full-text su utenti (username, displayName)
- Ricerca su contenuti per testo
- Ricerca su temi per nome
- Risultati unificati nella `SearchPage` con tab per categoria

### ⚙️ Impostazioni
- Modifica profilo (displayName, bio, location, website)
- Cambio password
- Cancellazione account
- Preferenze di visualizzazione (dark mode)

### ✅ Verifica identità
- Gli utenti possono richiedere la verifica dell'identità
- Gli admin revisionano e approvano/rifiutano le richieste
- L'utente verificato ottiene il ruolo `VERIFIED_USER` e la spunta blu ✅
- Solo i `VERIFIED_USER` possono creare un Alter Ego

### 🛡️ Moderazione
- Segnalazione di contenuti da parte degli utenti
- Dashboard moderazione con segnalazioni in attesa
- Azioni disponibili: censura contenuto, ban utente, ammonizione
- Gli admin possono revocare i ban
- Pannello completo accessibile a `MODERATOR` e `ADMIN`

### 📊 Attività utente
- Storico attività pubblica dell'utente (contenuti, commenti, reazioni)
- Endpoint dedicato `/api/users/{username}/activity`

---

## API REST

🔒 = richiede `Authorization: Bearer <token>`  
🛡️ = richiede ruolo `MODERATOR` o `ADMIN`  
👑 = richiede ruolo `ADMIN`

### Autenticazione
| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/api/auth/register` | Registrazione |
| POST | `/api/auth/login` | Login → JWT |

### Utenti
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/users/{username}/profile` | Profilo pubblico |
| PATCH | `/api/users/me` | Aggiorna profilo 🔒 |
| POST | `/api/users/me/avatar` | Carica avatar 🔒 |
| PATCH | `/api/users/me/password` | Cambio password 🔒 |
| DELETE | `/api/users/me` | Cancella account 🔒 |
| POST | `/api/users/{id}/follow` | Segui utente 🔒 |
| DELETE | `/api/users/{id}/follow` | Smetti di seguire 🔒 |
| GET | `/api/users/{username}/followers` | Lista follower |
| GET | `/api/users/{username}/following` | Lista following |
| GET | `/api/users/search?q=` | Cerca utenti |

### Contenuti
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/contents` | Feed esplora (paginato, filtrabile per tema) |
| GET | `/api/contents/{id}` | Singolo contenuto |
| POST | `/api/contents` | Crea contenuto 🔒 |
| PUT | `/api/contents/{id}` | Modifica contenuto 🔒 |
| DELETE | `/api/contents/{id}` | Elimina contenuto 🔒 |
| GET | `/api/users/{username}/contents` | Contenuti di un utente |

### Feed
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/feed` | Feed home personalizzato 🔒 |
| GET | `/api/feed/settings` | Preferenze feed 🔒 |
| PUT | `/api/feed/settings` | Aggiorna preferenze feed 🔒 |

### Reazioni
| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/api/contents/{id}/reactions` | Reagisci a un contenuto 🔒 |
| DELETE | `/api/contents/{id}/reactions` | Rimuovi reazione 🔒 |
| POST | `/api/comments/{id}/reactions` | Reagisci a un commento 🔒 |
| DELETE | `/api/comments/{id}/reactions` | Rimuovi reazione commento 🔒 |

### Commenti
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/contents/{id}/comments` | Commenti di un contenuto |
| POST | `/api/contents/{id}/comments` | Aggiungi commento 🔒 |
| DELETE | `/api/comments/{id}` | Elimina commento 🔒 |

### Temi
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/themes` | Lista tutti i temi |
| POST | `/api/themes` | Crea tema custom 🔒 |
| POST | `/api/themes/{id}/follow` | Segui tema 🔒 |
| DELETE | `/api/themes/{id}/follow` | Smetti di seguire tema 🔒 |

### Messaggi privati
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/messages/conversations` | Lista conversazioni 🔒 |
| GET | `/api/messages/conversations/{userId}` | Messaggi con utente 🔒 |
| POST | `/api/messages/conversations/{userId}` | Invia messaggio 🔒 |

### Notifiche
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/notifications` | Lista notifiche paginate 🔒 |
| PATCH | `/api/notifications/{id}/read` | Segna come letta 🔒 |
| PATCH | `/api/notifications/read-all` | Segna tutte come lette 🔒 |
| **WS** | `ws://host/api/ws` (STOMP) | Push real-time 🔒 |

### Ricerca
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/search?q=&type=` | Ricerca unificata (users / contents / themes) |

### Alter Ego
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/alter-egos/me` | Il proprio Alter Ego 🔒 |
| POST | `/api/alter-egos` | Crea Alter Ego 🔒 |
| PUT | `/api/alter-egos/me` | Aggiorna Alter Ego 🔒 |
| GET | `/api/alter-egos/{id}` | Profilo pubblico Alter Ego |

### Media
| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/api/media/upload` | Upload file (immagini/video) 🔒 |
| GET | `/api/media/{key}` | Recupera media |

### Verifica identità
| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/api/verification/request` | Richiedi verifica 🔒 |
| GET | `/api/verification/requests` | Lista richieste 👑 |
| POST | `/api/verification/requests/{id}/approve` | Approva 👑 |
| POST | `/api/verification/requests/{id}/reject` | Rifiuta 👑 |

### Segnalazioni
| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/api/reports` | Segnala contenuto 🔒 |

### Moderazione
| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/moderation/reports` | Segnalazioni in attesa 🛡️ |
| POST | `/api/moderation/reports/{id}/resolve` | Risolvi segnalazione 🛡️ |
| POST | `/api/moderation/contents/{id}/censor` | Censura contenuto 🛡️ |
| POST | `/api/moderation/users/{id}/ban` | Ban utente 🛡️ |
| POST | `/api/moderation/users/{id}/warn` | Ammonisci utente 🛡️ |

### Admin
| Metodo | Endpoint | Descrizione |
|---|---|---|
| POST | `/api/admin/bans/{id}/lift` | Revoca ban 👑 |

---

## Notifiche real-time (WebSocket)

Il server invia notifiche in push via STOMP appena vengono generate (follow, reazione, commento). Il frontend usa `useNotificationSocket`:

```typescript
useNotificationSocket((notification) => {
  // { id, actor, type, contentId, contentTitle, read, createdAt }
  addToastNotification(notification)
})
```

Il JWT viene passato nell'header `Authorization` del frame STOMP `CONNECT`. Le notifiche sono comunque persistite su DB e recuperabili via REST se l'utente è offline.

**Topic STOMP:** `/user/queue/notifications`

---

## Ruoli utente

| Ruolo | Descrizione |
|---|---|
| `USER` | Utente registrato — accesso completo alla piattaforma |
| `VERIFIED_USER` | Identità verificata con documento (spunta blu ✅). Può creare Alter Ego |
| `MODERATOR` | Gestisce segnalazioni, può censurare contenuti e bannare utenti |
| `ADMIN` | Accesso completo. Approva verifiche, revoca ban |

---

## Variabili d'ambiente

| Variabile | Default (dev) | Descrizione |
|---|---|---|
| `HAPPYPATH_JWT_SECRET` | *(hardcoded dev)* | Secret per firmare i JWT — **cambiare in produzione** |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db:5432/happypath` | URL PostgreSQL |
| `SPRING_REDIS_HOST` | `redis` | Host Redis |
| `MINIO_ENDPOINT` | `http://minio:9000` | Endpoint MinIO |
| `MINIO_ACCESS_KEY` | `minioadmin` | Access key MinIO |
| `MINIO_SECRET_KEY` | `minioadmin123` | Secret key MinIO |
| `ACTUATOR_USER` | `actuator` | Username HTTP Basic per Actuator |
| `ACTUATOR_PASSWORD` | `actuator123` | Password HTTP Basic per Actuator |
