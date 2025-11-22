import { db } from "./db";
import { users, specialties, academicYears, companies, pfeProposals } from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create specialties
    console.log("Creating specialties...");
    const [infoSpecialty] = await db.insert(specialties).values([
      {
        name: "Génie Informatique",
        code: "GI",
        department: "Département Informatique",
        isActive: true,
      },
      {
        name: "Génie Logiciel",
        code: "GL",
        department: "Département Informatique",
        isActive: true,
      },
      {
        name: "Réseaux et Télécommunications",
        code: "RT",
        department: "Département Télécommunications",
        isActive: true,
      },
      {
        name: "Intelligence Artificielle",
        code: "IA",
        department: "Département Informatique",
        isActive: true,
      },
    ]).returning();

    // Create academic year
    console.log("Creating academic year...");
    const [academicYear] = await db.insert(academicYears).values({
      name: "2024-2025",
      startDate: new Date("2024-09-01"),
      endDate: new Date("2025-06-30"),
      isActive: true,
    }).returning();

    // Create companies
    console.log("Creating companies...");
    const [company1] = await db.insert(companies).values([
      {
        name: "TechCorp Solutions",
        address: "123 Rue Mohammed V, Casablanca, Maroc",
        phone: "+212 5 22 XX XX XX",
        email: "contact@techcorp.ma",
        website: "https://techcorp.ma",
      },
      {
        name: "Innovation Labs",
        address: "45 Avenue Hassan II, Rabat, Maroc",
        phone: "+212 5 37 XX XX XX",
        email: "info@innovationlabs.ma",
        website: "https://innovationlabs.ma",
      },
    ]).returning();

    // Hash password for all users
    const password = await bcrypt.hash("password123", 10);

    // Create users
    console.log("Creating users...");
    const [admin] = await db.insert(users).values({
      email: "admin@pfe.ma",
      password,
      firstName: "Ahmed",
      lastName: "Benjelloun",
      phone: "+212 6 XX XX XX XX",
      role: "administrator",
      isActive: true,
    }).returning();

    const [coordinator] = await db.insert(users).values({
      email: "coordinator@pfe.ma",
      password,
      firstName: "Fatima",
      lastName: "El Alami",
      phone: "+212 6 XX XX XX XX",
      role: "coordinator",
      isActive: true,
    }).returning();

    const [supervisor1] = await db.insert(users).values({
      email: "supervisor1@pfe.ma",
      password,
      firstName: "Karim",
      lastName: "Tazi",
      phone: "+212 6 XX XX XX XX",
      role: "academic_supervisor",
      isActive: true,
    }).returning();

    const [supervisor2] = await db.insert(users).values({
      email: "supervisor2@pfe.ma",
      password,
      firstName: "Samira",
      lastName: "Bennani",
      phone: "+212 6 XX XX XX XX",
      role: "academic_supervisor",
      isActive: true,
    }).returning();

    const [student1] = await db.insert(users).values({
      email: "student1@pfe.ma",
      password,
      firstName: "Mohammed",
      lastName: "Alami",
      phone: "+212 6 XX XX XX XX",
      role: "student",
      isActive: true,
    }).returning();

    const [student2] = await db.insert(users).values({
      email: "student2@pfe.ma",
      password,
      firstName: "Yasmine",
      lastName: "Idrissi",
      phone: "+212 6 XX XX XX XX",
      role: "student",
      isActive: true,
    }).returning();

    const [student3] = await db.insert(users).values({
      email: "student3@pfe.ma",
      password,
      firstName: "Omar",
      lastName: "Mouhib",
      phone: "+212 6 XX XX XX XX",
      role: "student",
      isActive: true,
    }).returning();

    const [companySupervisor] = await db.insert(users).values({
      email: "company.supervisor@techcorp.ma",
      password,
      firstName: "Hassan",
      lastName: "Chraibi",
      phone: "+212 6 XX XX XX XX",
      role: "company_supervisor",
      isActive: true,
    }).returning();

    // Create some PFE proposals
    console.log("Creating PFE proposals...");
    await db.insert(pfeProposals).values([
      {
        title: "Développement d'une application mobile de gestion des stocks",
        type: "company",
        status: "validated",
        description: "Application mobile permettant de gérer les stocks en temps réel",
        context: "L'entreprise TechCorp nécessite une solution mobile pour optimiser la gestion de ses stocks de matériel informatique. Actuellement, le suivi se fait de manière manuelle ce qui entraîne des erreurs et des pertes de temps considérables.",
        problematic: "Comment développer une application mobile performante permettant un suivi en temps réel des stocks tout en offrant une interface intuitive pour les utilisateurs ?",
        objectives: "1. Développer une application mobile cross-platform (iOS/Android)\n2. Implémenter un système de scan de codes-barres\n3. Créer un dashboard de visualisation des statistiques\n4. Assurer la synchronisation en temps réel avec le backend",
        technologies: "React Native, Node.js, PostgreSQL, Firebase",
        studentId: student1.id,
        academicSupervisorId: supervisor1.id,
        companySupervisorId: companySupervisor.id,
        companyId: company1.id,
        specialtyId: infoSpecialty.id,
        academicYearId: academicYear.id,
        startDate: new Date("2024-09-15"),
        endDate: new Date("2025-06-15"),
        validatedAt: new Date("2024-09-20"),
      },
      {
        title: "Système de recommandation basé sur l'intelligence artificielle",
        type: "academic",
        status: "submitted",
        description: "Système de recommandation de contenus utilisant des algorithmes de machine learning",
        context: "Les plateformes de streaming et e-commerce utilisent des systèmes de recommandation pour améliorer l'expérience utilisateur. Ce projet vise à développer un tel système en utilisant des techniques d'IA modernes.",
        problematic: "Comment concevoir un système de recommandation efficace qui s'adapte aux préférences évolutives des utilisateurs ?",
        objectives: "1. Étudier les algorithmes de filtrage collaboratif\n2. Implémenter un modèle de deep learning pour les recommandations\n3. Évaluer les performances avec différentes métriques\n4. Développer une API REST pour l'intégration",
        technologies: "Python, TensorFlow, FastAPI, PostgreSQL, Docker",
        studentId: student2.id,
        specialtyId: infoSpecialty.id,
        academicYearId: academicYear.id,
        submittedAt: new Date("2024-10-01"),
      },
      {
        title: "Plateforme de gestion des projets universitaires",
        type: "academic",
        status: "draft",
        description: "Application web pour faciliter la gestion et le suivi des projets de fin d'études",
        context: "Les établissements universitaires ont besoin d'outils modernes pour gérer efficacement les PFE, depuis la soumission jusqu'à la soutenance.",
        problematic: "Comment créer une plateforme complète qui centralise tous les aspects de la gestion des PFE ?",
        objectives: "1. Développer une interface intuitive pour tous les acteurs\n2. Implémenter un workflow de validation\n3. Intégrer un système d'analyse de plagiat\n4. Créer des tableaux de bord personnalisés par rôle",
        technologies: "React, TypeScript, Node.js, PostgreSQL, TailwindCSS",
        studentId: student3.id,
        specialtyId: infoSpecialty.id,
        academicYearId: academicYear.id,
      },
    ]);

    console.log("✅ Seed completed successfully!");
    console.log("\n📋 Test accounts:");
    console.log("  Admin: admin@pfe.ma / password123");
    console.log("  Coordinator: coordinator@pfe.ma / password123");
    console.log("  Supervisor 1: supervisor1@pfe.ma / password123");
    console.log("  Supervisor 2: supervisor2@pfe.ma / password123");
    console.log("  Student 1: student1@pfe.ma / password123");
    console.log("  Student 2: student2@pfe.ma / password123");
    console.log("  Student 3: student3@pfe.ma / password123");
    console.log("  Company Supervisor: company.supervisor@techcorp.ma / password123");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
