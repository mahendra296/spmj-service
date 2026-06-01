import logger from "../utils/logger.js";

const programs = [
  {
    icon: "spark",
    title: "Free Foundational Schooling",
    description:
      "Free, quality schooling for children from underserved communities — books, uniforms, and a safe place to learn and grow.",
  },
  {
    icon: "layers",
    title: "After-School Learning Centres",
    description:
      "Daily homework help, remedial classes, and community libraries that keep first-generation learners on track.",
  },
  {
    icon: "code",
    title: "Digital & STEM Labs",
    description:
      "Hands-on computer literacy, coding, and science activities that prepare every student for a digital world.",
  },
  {
    icon: "chart",
    title: "Scholarships & Mentoring",
    description:
      "Need-based scholarships, tutoring, and one-to-one mentorship that help students stay in school and reach higher education.",
  },
  {
    icon: "cloud",
    title: "Teacher & Volunteer Training",
    description:
      "Training, lesson resources, and ongoing support for community teachers and volunteers so good teaching reaches every classroom.",
  },
  {
    icon: "shield",
    title: "Child Welfare & Nutrition",
    description:
      "Nutritious meals, regular health check-ups, and child-safe spaces — because no child should ever learn on an empty stomach.",
  },
];

export const getHomePage = async (req, res) => {
  try {
    return res.render("index", {
      title: "SPMJ Foundation — Education for every child",
      page: "home",
      programs,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const getAboutPage = async (req, res) => {
  try {
    return res.render("about", {
      title: "About — SPMJ Foundation",
      page: "about",
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const getServicesPage = async (req, res) => {
  try {
    return res.render("services", {
      title: "Programs — SPMJ Foundation",
      page: "services",
      programs,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};
