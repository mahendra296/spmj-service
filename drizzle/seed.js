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
      title: "Annual STEM & Digital Learning Camp",
      summary: "A week-long hands-on camp with coding, robotics, and science labs.",
      description:
        "Our flagship STEM camp brings together students from all our learning centres for a week of discovery.\n\nChildren rotate through coding, robotics, and hands-on science stations led by volunteer engineers and teachers. The week ends with a project showcase for families.",
      location: "SPMJ Main Centre, New Delhi",
      eventDate: day(21),
      published: true,
      createdBy: adminId,
    });
    await createEvent({
      title: "Community Reading Day",
      summary: "Storytelling, book donations, and a new mobile library launch.",
      description:
        "A celebration of reading across our community.\n\nVolunteers and parents joined children for storytelling sessions, and we launched a mobile library to reach three new neighbourhoods.",
      location: "Vidya Marg Grounds",
      eventDate: day(-30),
      published: true,
      createdBy: adminId,
    });
    console.log("Seeded sample events.");
  }

  if ((await countBlogPosts()) === 0) {
    await createBlogPost({
      title: "5,000 children and counting: our 2024 in review",
      category: "announcement",
      excerpt:
        "A look back at a year of new centres, scholarships, and digital labs.",
      content:
        "This year SPMJ Foundation reached more children than ever before.\n\nWe opened new learning centres, expanded our scholarship programme, and launched two new digital labs. Thank you to every supporter, volunteer, and partner who made it possible.",
      author: "SPMJ Team",
      published: true,
      createdBy: adminId,
    });
    await createBlogPost({
      title: "Local press features our digital lab programme",
      category: "press",
      excerpt: "Coverage of how our STEM labs are changing futures.",
      content:
        "We were honoured to be featured in regional press this month.\n\nThe piece highlighted how our digital and STEM labs are giving first-generation learners the skills and confidence to pursue higher education and technical careers.",
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
