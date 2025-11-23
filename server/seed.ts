import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Adding 3 accounts per role...");

  try {
    // Hash password for all users
    const password = await bcrypt.hash("password123", 10);

    // Create 3 ADMINISTRATORS
    console.log("Creating 3 administrators...");
    await db.insert(users).values([
      {
        email: "admin1@pfe.ma",
        password,
        firstName: "Ahmed",
        lastName: "Benjelloun",
        phone: "+212 6 XX XX XX XX",
        role: "administrator",
        isActive: true,
      },
      {
        email: "admin2@pfe.ma",
        password,
        firstName: "Fatima",
        lastName: "Bennani",
        phone: "+212 6 XX XX XX XX",
        role: "administrator",
        isActive: true,
      },
      {
        email: "admin3@pfe.ma",
        password,
        firstName: "Hassan",
        lastName: "Moussa",
        phone: "+212 6 XX XX XX XX",
        role: "administrator",
        isActive: true,
      },
    ]);

    // Create 3 COORDINATORS
    console.log("Creating 3 coordinators...");
    await db.insert(users).values([
      {
        email: "coordinator1@pfe.ma",
        password,
        firstName: "Karim",
        lastName: "Tazi",
        phone: "+212 6 XX XX XX XX",
        role: "coordinator",
        isActive: true,
      },
      {
        email: "coordinator2@pfe.ma",
        password,
        firstName: "Samira",
        lastName: "El Alami",
        phone: "+212 6 XX XX XX XX",
        role: "coordinator",
        isActive: true,
      },
      {
        email: "coordinator3@pfe.ma",
        password,
        firstName: "Mohammed",
        lastName: "Lahrach",
        phone: "+212 6 XX XX XX XX",
        role: "coordinator",
        isActive: true,
      },
    ]);

    // Create 3 MANAGERS
    console.log("Creating 3 managers...");
    await db.insert(users).values([
      {
        email: "manager1@pfe.ma",
        password,
        firstName: "Nour",
        lastName: "Chraibi",
        phone: "+212 6 XX XX XX XX",
        role: "manager",
        isActive: true,
      },
      {
        email: "manager2@pfe.ma",
        password,
        firstName: "Zahra",
        lastName: "Idrissi",
        phone: "+212 6 XX XX XX XX",
        role: "manager",
        isActive: true,
      },
      {
        email: "manager3@pfe.ma",
        password,
        firstName: "Omar",
        lastName: "Medioni",
        phone: "+212 6 XX XX XX XX",
        role: "manager",
        isActive: true,
      },
    ]);

    // Create 3 ACADEMIC SUPERVISORS
    console.log("Creating 3 academic supervisors...");
    await db.insert(users).values([
      {
        email: "supervisor1@pfe.ma",
        password,
        firstName: "Dr. Ahmed",
        lastName: "Qadir",
        phone: "+212 6 XX XX XX XX",
        role: "academic_supervisor",
        isActive: true,
      },
      {
        email: "supervisor2@pfe.ma",
        password,
        firstName: "Prof. Leila",
        lastName: "Hassan",
        phone: "+212 6 XX XX XX XX",
        role: "academic_supervisor",
        isActive: true,
      },
      {
        email: "supervisor3@pfe.ma",
        password,
        firstName: "Dr. Ibrahim",
        lastName: "Rami",
        phone: "+212 6 XX XX XX XX",
        role: "academic_supervisor",
        isActive: true,
      },
    ]);

    // Create 3 COMPANY SUPERVISORS
    console.log("Creating 3 company supervisors...");
    await db.insert(users).values([
      {
        email: "company.supervisor1@techcorp.ma",
        password,
        firstName: "Hassan",
        lastName: "Chraibi",
        phone: "+212 6 XX XX XX XX",
        role: "company_supervisor",
        isActive: true,
      },
      {
        email: "company.supervisor2@techcorp.ma",
        password,
        firstName: "Youssef",
        lastName: "Mansouri",
        phone: "+212 6 XX XX XX XX",
        role: "company_supervisor",
        isActive: true,
      },
      {
        email: "company.supervisor3@innovationlabs.ma",
        password,
        firstName: "Latifa",
        lastName: "Bennani",
        phone: "+212 6 XX XX XX XX",
        role: "company_supervisor",
        isActive: true,
      },
    ]);

    // Create 3 STUDENTS
    console.log("Creating 3 students...");
    await db.insert(users).values([
      {
        email: "student1@pfe.ma",
        password,
        firstName: "Mohammed",
        lastName: "Alami",
        phone: "+212 6 XX XX XX XX",
        role: "student",
        isActive: true,
      },
      {
        email: "student2@pfe.ma",
        password,
        firstName: "Yasmine",
        lastName: "Idrissi",
        phone: "+212 6 XX XX XX XX",
        role: "student",
        isActive: true,
      },
      {
        email: "student3@pfe.ma",
        password,
        firstName: "Omar",
        lastName: "Mouhib",
        phone: "+212 6 XX XX XX XX",
        role: "student",
        isActive: true,
      },
    ]);

    console.log("✅ Accounts created successfully!");
    console.log("\n📋 Test accounts (password: password123)\n");
    
    console.log("👨‍💼 ADMINISTRATORS (3):");
    console.log("  1. admin1@pfe.ma");
    console.log("  2. admin2@pfe.ma");
    console.log("  3. admin3@pfe.ma\n");

    console.log("📋 COORDINATORS (3):");
    console.log("  1. coordinator1@pfe.ma");
    console.log("  2. coordinator2@pfe.ma");
    console.log("  3. coordinator3@pfe.ma\n");

    console.log("⚙️ MANAGERS (3):");
    console.log("  1. manager1@pfe.ma");
    console.log("  2. manager2@pfe.ma");
    console.log("  3. manager3@pfe.ma\n");

    console.log("👨‍🏫 ACADEMIC SUPERVISORS (3):");
    console.log("  1. supervisor1@pfe.ma");
    console.log("  2. supervisor2@pfe.ma");
    console.log("  3. supervisor3@pfe.ma\n");

    console.log("🏢 COMPANY SUPERVISORS (3):");
    console.log("  1. company.supervisor1@techcorp.ma");
    console.log("  2. company.supervisor2@techcorp.ma");
    console.log("  3. company.supervisor3@innovationlabs.ma\n");

    console.log("👨‍🎓 STUDENTS (3):");
    console.log("  1. student1@pfe.ma");
    console.log("  2. student2@pfe.ma");
    console.log("  3. student3@pfe.ma\n");

    console.log("🎉 Total: 18 test accounts created (3 per role)");
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
