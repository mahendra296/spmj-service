import { hashPassword } from "../service/auth-service.js";
import { upsertUserByEmail } from "../service/user-service.js";
import { ROLES } from "../config/constant.js";
import { db, closeDb } from "../config/db.js";
import {
  countEvents,
  createEvent,
} from "../service/event-service.js";
import { countBlogPosts, createBlogPost } from "../service/blog-service.js";
import { countGalleryItems, createGalleryItem } from "../service/gallery-service.js";

const seedUsers = async () => {
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
  return seededAdmin;
};

const day = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(10, 0, 0, 0);
  return d;
};

const seedContent = async (adminId) => {
  // Only seed sample content into empty tables so re-running is safe.
  if ((await countEvents()) === 0) {
    await createEvent({
      title: "Community Health Awareness Camp",
      summary: "A free health check-up and awareness camp for women and children.",
      description:
        "Our health awareness camp brings together local volunteers and health workers for a day of check-ups and guidance.\n\nFamilies receive free health check-ups, nutrition guidance, and awareness sessions on hygiene and maternal & child health. The day ends with a community discussion for families.",
      location: "SPMJ Foundation Office, Palanpur",
      eventDate: day(21),
      published: true,
      createdBy: adminId,
    });
    await createEvent({
      title: "Women & Child Development Meet",
      summary: "Awareness session and support drive for women and children.",
      description:
        "A gathering focused on women's empowerment and child welfare across our community.\n\nVolunteers and local families joined for awareness sessions, and we launched a new outreach drive to reach three new neighbourhoods.",
      location: "Vav Tharad, Banaskantha",
      eventDate: day(-30),
      published: true,
      createdBy: adminId,
    });
    console.log("Seeded sample events.");
  }

  if ((await countBlogPosts()) === 0) {
    await createBlogPost({
      title: "Our 2024 in review: education, health, and community",
      category: "announcement",
      excerpt:
        "A look back at a year of health camps, education support, and outreach for women and children.",
      content:
        "This year SPMJ Foundation reached more families than ever before.\n\nWe conducted health awareness camps, expanded our education and child development efforts, and reached new communities across Banaskantha. Thank you to every supporter, volunteer, and partner who made it possible.",
      author: "SPMJ Foundation Team",
      published: true,
      createdBy: adminId,
    });
    await createBlogPost({
      title: "Local press features our health awareness camps",
      category: "press",
      excerpt: "Coverage of how our health camps are changing lives.",
      content:
        "We were honoured to be featured in regional press this month.\n\nThe piece highlighted how our health awareness camps and women & child development programs are giving families across the region better access to care and support.",
      author: "Communications",
      published: true,
      createdBy: adminId,
    });
    console.log("Seeded sample blog posts.");
  }

  if ((await countGalleryItems()) === 0) {
    await createGalleryItem({
      title: "Learning centre, morning class",
      caption: "Children at our main centre during a morning session.",
      mediaType: "image",
      mediaUrl: "/images/slide-1.svg",
      createdBy: adminId,
    });
    await createGalleryItem({
      title: "Digital lab in action",
      caption: "Students exploring the coding station.",
      mediaType: "image",
      mediaUrl: "/images/slide-3.svg",
      createdBy: adminId,
    });
    console.log("Seeded sample gallery items.");
  }
};

const seed = async () => {
  const admin = await seedUsers();
  await seedContent(admin?.id);
};

seed()
  .then(closeDb)
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await closeDb();
    process.exit(1);
  });
