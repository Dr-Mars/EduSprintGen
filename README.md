# 📚 PFE Management Platform - Guide d'Installation Locale

Une plateforme complète de gestion des Projets de Fin d'Études (PFE) pour universités avec authentification multi-rôles, workflows PFE, gestion des rapports, défenses, grading automatisé et analyses IA.

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement](#lancement)
- [Architecture](#architecture)
- [Fonctionnalités](#fonctionnalités)
- [Dépannage](#dépannage)

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir installé:

### 1. **Node.js & npm**
- **Node.js:** v18.0.0 ou supérieur
- **npm:** v9.0.0 ou supérieur
- **Vérifier l'installation:**
  ```bash
  node --version
  npm --version
  ```

### 2. **Git**
- Pour cloner le repository
- **Vérifier l'installation:**
  ```bash
  git --version
  ```

### 3. **PostgreSQL** (Optionnel - pour production)
- Base de données locale ou cloud (Neon, Supabase)
- Pour le développement, une base en mémoire est disponible

### 4. **Éditeur de Code**
- VS Code (recommandé)
- WebStorm, Sublime Text, ou autre

---

## 🚀 Installation

### Étape 1: Cloner le Repository

```bash
git clone https://github.com/your-username/pfe-management-platform.git
cd pfe-management-platform
```

### Étape 2: Installer les Dépendances

```bash
npm install
```

Cela va installer:
- **Frontend:** React 18, Tailwind CSS, shadcn/ui, React Query, Wouter
- **Backend:** Express.js, Drizzle ORM, Zod, Bcrypt
- **Outils:** TypeScript, Vite, ESBuild

### Étape 3: Vérifier l'Installation

```bash
npm list react react-dom
npm list typescript
```

---

## ⚙️ Configuration

### Étape 1: Créer le Fichier .env

Créez un fichier `.env.local` à la racine du projet:

```bash
touch .env.local
```

### Étape 2: Ajouter les Variables d'Environnement

Ajoutez les configuration minimales:

```env
# ============================================
# DATABASE (Optionnel - utilise MemStorage par défaut)
# ============================================
# Pour PostgreSQL local:
DATABASE_URL=postgresql://user:password@localhost:5432/pfe_db
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=pfe_db

# ============================================
# SESSIONS
# ============================================
SESSION_SECRET=your-super-secret-key-min-32-chars-long

# ============================================
# AI FEATURES (Optionnel)
# ============================================
GEMINI_API_KEY=your_gemini_api_key_here

# ============================================
# FRONTEND
# ============================================
VITE_API_URL=http://localhost:5000
```

### Étape 3: Obtenir les Clés API (Optionnel)

#### Pour Gemini AI (Optionnel):
1. Aller à [Google AI Studio](https://aistudio.google.com)
2. Créer une clé API
3. Ajouter à `.env.local`

#### Pour PostgreSQL Local:
```bash
# Installer PostgreSQL
# macOS:
brew install postgresql@15

# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# Windows:
# Télécharger depuis https://www.postgresql.org/download/windows/

# Démarrer PostgreSQL
brew services start postgresql@15

# Créer une base de données:
createdb pfe_db
```

---

## 🏃 Lancement

### Méthode 1: Mode Développement (Recommandé)

```bash
npm run dev
```

Cela démarre:
- 🔵 **Frontend Vite:** http://localhost:5000
- 🔴 **Backend Express:** http://localhost:5000/api
- 🔄 **Hot Module Reload:** Changements en temps réel

**Accès:**
- Application: http://localhost:5000
- Vite App: http://localhost:5173 (si dev séparé)

### Méthode 2: Mode Production

```bash
# Compiler l'application
npm run build

# Lancer le serveur de production
npm run start
```

### Méthode 3: Développement Séparé Frontend/Backend

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev:client
```

---

## 🗄️ Configuration Base de Données

### Option A: MemStorage (Défaut - Développement)
Aucune configuration nécessaire. Les données sont stockées en mémoire.

### Option B: PostgreSQL Local

#### 1. Créer la Base de Données:
```bash
createdb pfe_db
```

#### 2. Modifier `.env.local`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/pfe_db
```

#### 3. Synchroniser le Schéma (Drizzle):
```bash
npm run db:push
```

Ou forcer si nécessaire:
```bash
npm run db:push -- --force
```

#### 4. Vérifier la Connexion:
```bash
psql -U postgres -d pfe_db -c "SELECT version();"
```

### Option C: Neon Cloud PostgreSQL

1. Créer un compte sur [Neon](https://neon.tech)
2. Créer un projet et une base de données
3. Copier la `DATABASE_URL`
4. Ajouter à `.env.local`:
```env
DATABASE_URL=postgresql://user:password@host.neon.tech:5432/dbname
```

---

## 📱 Accéder à l'Application

### URL Locales:
- **Application:** http://localhost:5000
- **API:** http://localhost:5000/api
- **Vite Dev (optionnel):** http://localhost:5173

### Identifiants de Test:

#### Admin:
```
Email: admin@example.com
Password: Admin@123
```

#### Étudiant:
```
Email: student@example.com
Password: Student@123
```

#### Enseignant:
```
Email: teacher@example.com
Password: Teacher@123
```

### Fonctionnalités Accessibles:
- ✅ Authentification
- ✅ Proposition PFE (4 étapes)
- ✅ Gestion rapports
- ✅ Planification défenses
- ✅ Évaluations
- ✅ Notifications
- ✅ Analytics
- ✅ Gestion admin
- ✅ Videoconférences
- ✅ Signatures numériques
- ✅ Analyses IA (si GEMINI_API_KEY)

---

## 📂 Structure du Projet

```
pfe-management-platform/
├── server/
│   ├── index-dev.ts              # Serveur développement
│   ├── index-prod.ts             # Serveur production
│   ├── routes.ts                 # 80+ routes API
│   ├── storage.ts                # Couche données
│   ├── auth-middleware.ts        # Authentification
│   ├── ai-validation.ts          # IA Gemini
│   ├── gemini-feedback-service.ts
│   ├── pdf-watermark-service.ts  # Watermarking PDF
│   ├── email-service.ts          # Emails
│   └── vite.ts                   # Config Vite
│
├── client/
│   └── src/
│       ├── pages/               # 25 pages
│       │   ├── home.tsx
│       │   ├── login.tsx
│       │   ├── dashboard.tsx
│       │   ├── proposals.tsx
│       │   ├── reports.tsx
│       │   ├── defenses.tsx
│       │   ├── evaluations.tsx
│       │   ├── videoconferences/
│       │   ├── signatures/
│       │   └── admin/
│       ├── components/          # Composants réutilisables
│       │   └── ui/             # Shadcn components
│       ├── hooks/              # React hooks
│       ├── lib/                # Utilitaires
│       ├── App.tsx             # Router
│       └── index.css           # Styles globaux
│
├── shared/
│   └── schema.ts               # Types TypeScript + Zod
│
├── vite.config.ts              # Config Vite
├── tailwind.config.ts          # Tailwind
├── tsconfig.json               # TypeScript
├── .env.local                  # Variables d'env
└── package.json
```

---

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev                    # Mode dev (frontend + backend)
npm run dev:server             # Backend seul
npm run dev:client             # Frontend seul

# Build & Production
npm run build                  # Compile tout
npm run start                  # Lance le serveur de prod

# Database
npm run db:push                # Sync schema (Drizzle)
npm run db:push -- --force     # Force sync
npm run db:studio              # Drizzle Studio (GUI)

# Type checking
npm run type-check             # Vérifie les types
```

---

## 📊 Fonctionnalités Principales

### ✅ Authentification
- Login/Register email/password
- 6 rôles (Student, Academic Supervisor, Company Supervisor, Coordinator, Manager, Admin)
- Password reset par email
- Sessions sécurisées

### ✅ Propositions PFE
- Formulaire 4 étapes
- Types: Academic, Company, Research
- Validation automatique
- Workflow: Draft → Submitted → To Modify/Approved/Rejected

### ✅ Rapports
- Upload avec drag & drop
- Versioning automatique
- Plagiarism detection (Gemini AI)
- PDF Watermarking
- Timeline des versions

### ✅ Défenses
- Planification calendar
- Gestion jury
- Détection conflits d'intérêt
- Notation 3 critères (30-40-30)

### ✅ IA Features
- Analyse qualité propositions (Gemini 2.5 Pro)
- Détection plagiat (Gemini 2.5 Pro)
- Feedback évaluations (Gemini 2.5 Flash)

### ✅ Admin
- Gestion spécialités
- Gestion types PFE
- Audit logs
- Paramètres système

### ✅ Autres
- Notifications (8 types)
- Analytics & statistiques
- Archives (JSON/CSV export)
- Videoconférences
- Signatures numériques
- PFE Duration Timeline

---

## 🐛 Dépannage

### Problème: "Port 5000 already in use"
```bash
# Trouver le processus
lsof -i :5000

# Tuer le processus (macOS/Linux)
kill -9 <PID>

# Ou changer le port dans server/index-dev.ts
```

### Problème: "Cannot find module"
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Problème: "Database connection failed"
```bash
# Vérifier la connexion PostgreSQL
psql $DATABASE_URL -c "SELECT 1"

# Ou utiliser MemStorage (défaut)
# Commenter DATABASE_URL dans .env.local
```

### Problème: "TypeScript errors"
```bash
# Vérifier les types
npm run type-check

# Compiler
npm run build
```

### Problème: "Vite build too large"
```bash
# Voir la taille du bundle
npm run build

# Les chunks > 500KB sont normaux pour cette plateforme
# Utiliser dynamic import() si nécessaire
```

### Problème: "AI features not working"
- Vérifier `GEMINI_API_KEY` dans `.env.local`
- Les features IA sont optionnelles
- Sans clé API, tout fonctionne quand même

---

## 📈 Performance

### Optimisations Recommandées:
1. **Compression:** Gzip activé par défaut
2. **Caching:** React Query cache 5 minutes par défaut
3. **Lazy Loading:** Dynamic import sur routes
4. **Database:** Créer des indexes si PostgreSQL

### Métriques Actuelles:
- **Build:** 24.59s
- **CSS:** 79.25 KB (gzip: 12.81 KB)
- **JS:** 1,116 KB (gzip: 313 KB)
- **Pages:** 25+ pages
- **API Routes:** 80+ endpoints

---

## 🔒 Sécurité

### En Production:
```bash
# Changer les valeurs par défaut
SESSION_SECRET=super-secure-random-secret-min-32-chars
```

### Bonnes Pratiques:
- ✅ Passwords hashés (bcrypt)
- ✅ Sessions sécurisées
- ✅ Input validation (Zod)
- ✅ CORS configuré
- ✅ Pas de secrets en hardcod

---

## 📚 Documentation Supplémentaire

- **AI Features:** Voir `AI_VERIFICATION_REPORT.md`
- **Quality Report:** Voir `MODULE_QUALITY_REPORT.md`
- **Design Guide:** Voir `design_guidelines.md`
- **Project State:** Voir `replit.md`

---

## 🤝 Support

### Si vous rencontrez un problème:

1. Vérifier les logs console et serveur
2. Consulter les sections Dépannage ci-dessus
3. Vérifier le fichier `.env.local`
4. Réinstaller les dépendances
5. Vider le cache (`rm -rf dist node_modules`)

### Logs:
```bash
# Backend logs - dans le terminal npm run dev
# Frontend logs - dans la console du navigateur (F12)
# Database logs - si PostgreSQL activé
```

---

## 🎓 Étapes Rapides (TL;DR)

```bash
# 1. Cloner
git clone <repo-url> && cd pfe-management-platform

# 2. Installer
npm install

# 3. Configurer
echo "SESSION_SECRET=$(openssl rand -base64 32)" > .env.local

# 4. Lancer
npm run dev

# 5. Accéder
# http://localhost:5000
```

---

## ✅ Vérification d'Installation

Après lancement, vérifier:

- [ ] Application charge sur http://localhost:5000
- [ ] Page login accessible
- [ ] Pas d'erreurs dans la console (F12)
- [ ] Pas d'erreurs dans le terminal
- [ ] Database connectée (ou MemStorage actif)

---

## 📊 Spécifications Finales

| Aspect | Détails |
|--------|---------|
| **Node.js** | v18+ |
| **npm** | v9+ |
| **Frontend** | React 18 + Vite |
| **Backend** | Express.js |
| **Database** | PostgreSQL (ou MemStorage) |
| **TypeScript** | Strict mode |
| **Port** | 5000 (développement) |

---

**Dernière mise à jour:** 1 Décembre 2025  
**Version:** 1.0 (Phase 4 - Production Ready)  
**Status:** ✅ Prêt pour le déploiement
