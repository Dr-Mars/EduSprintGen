# Plateforme PFE - Gestion des Projets de Fin d'Études

## Vue d'ensemble
Application web moderne pour la gestion complète des Projets de Fin d'Études (PFE) dans les établissements universitaires. Inspirée de Moodle et Google Classroom, cette plateforme offre un workflow complet de la soumission des propositions jusqu'à l'évaluation des soutenances.

## Stack technique
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript  
- **Base de données**: PostgreSQL avec Drizzle ORM
- **UI**: Shadcn UI + Tailwind CSS
- **Formulaires**: React Hook Form + Zod
- **État**: TanStack Query (React Query v5)
- **Routing**: Wouter

## Architecture du projet

### Structure des dossiers
```
├── client/                 # Application frontend React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   │   ├── ui/        # Composants Shadcn UI
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── stat-card.tsx
│   │   │   └── status-badge.tsx
│   │   ├── pages/         # Pages de l'application
│   │   │   ├── login.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── proposal-form.tsx
│   │   │   ├── proposals-list.tsx
│   │   │   ├── reports.tsx
│   │   │   ├── defenses.tsx
│   │   │   ├── users-management.tsx
│   │   │   └── not-found.tsx
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilitaires et configuration
│   │   ├── App.tsx        # Point d'entrée de l'app
│   │   └── index.css      # Styles globaux + design tokens
│   └── index.html
├── server/                # Application backend Express
│   ├── app.ts            # Configuration Express
│   ├── routes.ts         # Définition des routes API
│   ├── storage.ts        # Interface de stockage
│   └── db.ts             # Configuration base de données
├── shared/               # Code partagé frontend/backend
│   └── schema.ts         # Schémas Drizzle + types TypeScript + validation Zod
└── design_guidelines.md  # Directives de design

### Modèle de données

#### Tables principales
- **users**: Utilisateurs avec rôles (étudiant, encadrant académique, encadrant entreprise, coordinateur, gestionnaire, administrateur)
- **academic_years**: Années académiques
- **specialties**: Spécialités/départements
- **companies**: Entreprises partenaires
- **pfe_proposals**: Propositions de PFE avec workflow de validation
- **reports**: Rapports avec versioning et analyse de plagiat
- **defenses**: Soutenances planifiées
- **jury_members**: Composition des jurys
- **evaluations**: Évaluations multi-critères

#### Workflow PFE
1. **Brouillon** → Étudiant crée une proposition
2. **Soumis** → Étudiant soumet pour validation
3. **À modifier** → Coordinateur demande des modifications
4. **Validé** → Coordinateur approuve la proposition
5. **Rejeté** → Coordinateur rejette la proposition

## Fonctionnalités MVP

### Authentification (Sprint 1)
- ✅ Connexion par email/mot de passe
- ✅ Gestion du compte utilisateur
- ✅ Système de rôles (RBAC)
- ✅ Interface d'administration des utilisateurs

### Propositions PFE (Sprint 2)
- ✅ Formulaire multi-étapes avec validation
- ✅ Workflow de validation coordinateur
- ✅ Affectation des encadrants académiques
- ✅ Gestion des statuts (brouillon, soumis, validé, rejeté)

### Rapports (Sprint 3)
- ✅ Upload de rapports PDF
- ✅ Versioning des rapports
- ✅ Historique des soumissions
- ✅ Préparation pour analyse de plagiat (Phase 2)

### Soutenances (Sprint 4)
- ✅ Planification avec calendrier
- ✅ Composition des jurys avec contraintes
- ✅ Système d'évaluation multi-critères
- ✅ Calcul automatique des notes finales

### Dashboards
- ✅ Dashboard personnalisé par rôle
- ✅ Statistiques et métriques
- ✅ Activité récente
- ✅ Actions rapides

## Design System

### Palette de couleurs
- **Primaire**: `hsl(342, 85%, 53%)` - Rouge vibrant pour CTAs et éléments importants
- **Secondaire**: `hsl(0, 0%, 77%)` - Gris clair pour bordures
- **Background**: `hsl(0, 0%, 94%)` - Gris très clair pour fond de page
- **Surface**: `hsl(0, 0%, 100%)` - Blanc pour cartes et surfaces élevées

### Typographie
- **Police**: Poppins (Google Fonts)
- **Headings**: 32px/24px/20px/16px avec font-semibold/medium
- **Body**: 16px/14px/12px avec font-normal

### Espacements
- Padding de carte: `p-6`
- Espacement de section: `py-8` ou `py-12`
- Gap entre cartes: `gap-6`
- Espacement de formulaire: `space-y-4`

### Composants
- Border radius: `0.8rem` (tel que spécifié)
- Cartes avec hover states subtils
- Badges de statut colorés
- Formulaires avec validation inline
- Tableaux avec alternance de couleurs

## Rôles et permissions

### Étudiant
- Créer et modifier sa proposition PFE
- Déposer des rapports
- Consulter sa soutenance et ses notes

### Encadrant académique/entreprise
- Voir ses encadrements
- Consulter les rapports
- Participer aux jurys

### Coordinateur
- Valider/rejeter les propositions
- Affecter les encadrants
- Planifier les soutenances

### Gestionnaire
- Planifier les soutenances
- Gérer les créneaux et salles
- Composer les jurys

### Administrateur
- Gestion complète des utilisateurs
- Configuration système
- Accès à toutes les fonctionnalités

## Prochaines étapes (Phase 2)

### Fonctionnalités futures
- Intégration service IA pour analyse de plagiat
- Notifications en temps réel (in-app + email)
- Messagerie interne sécurisée
- Génération de documents PDF (conventions, attestations)
- Analytics avancés avec statistiques détaillées
- Export de données (CSV/Excel)
- Gestion des années académiques
- Configuration des grilles d'évaluation

## Commandes utiles

```bash
# Développement
npm run dev              # Démarrer le serveur de développement

# Base de données
npm run db:push          # Pousser le schéma vers la base de données
npm run db:push --force  # Forcer la mise à jour du schéma (destructif)

# Build
npm run build            # Construire pour la production
npm start                # Démarrer en mode production
```

## Notes de développement

### Changements récents
- **2024-01**: Création du schéma complet de la base de données
- **2024-01**: Implémentation de tous les composants frontend MVP
- **2024-01**: Configuration du design system avec Poppins et couleurs personnalisées

### Préférences utilisateur
- Design inspiré de Moodle/Google Classroom
- Palette rouge vibrant comme couleur principale
- Police Poppins pour une apparence moderne
- Espacement généreux (16px base)
- Border radius de 0.8rem pour cohérence visuelle

### Décisions architecturales
- Schema-first approach avec Drizzle ORM
- Validation unifiée avec Zod (frontend + backend)
- React Query pour gestion d'état serveur
- Shadcn UI pour composants cohérents
- Sidebar navigation pour meilleure UX
