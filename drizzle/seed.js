import { hashPassword } from "../service/auth-service.js";
import { upsertUserByEmail } from "../service/user-service.js";
import { ROLES } from "../config/constant.js";
import { closeDb } from "../config/db.js";

const seed = async () => {
  const admin = {
    name: "SPMJ Admin",
    email: (process.env.ADMIN_EMAIL || "admin@spmjfoundation.org").toLowerCase(),
    password: await hashPassword(process.env.ADMIN_PASSWORD || "Admin@123"),
    role: ROLES.ADMIN,
  };

  const user = {
    name: "SPMJ User",
    email: (process.env.USER_EMAIL || "user@spmjfoundation.org").toLowerCase(),
    password: await hashPassword(process.env.USER_PASSWORD || "User@123"),
    role: ROLES.USER,
  };

  const seededAdmin = await upsertUserByEmail(admin);
  const seededUser = await upsertUserByEmail(user);

  console.log(`Seeded ${seededAdmin.role}: ${seededAdmin.email}`);
  console.log(`Seeded ${seededUser.role}: ${seededUser.email}`);
};

seed()
  .then(closeDb)
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await closeDb();
    process.exit(1);
  });
