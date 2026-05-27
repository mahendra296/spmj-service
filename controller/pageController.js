import logger from "../utils/logger.js";

const services = [
  {
    icon: "spark",
    title: "Strategy & Consulting",
    description:
      "Tailored business strategies that align with your vision and unlock measurable growth.",
  },
  {
    icon: "layers",
    title: "Product Design",
    description:
      "Beautifully crafted interfaces that turn complex ideas into intuitive user experiences.",
  },
  {
    icon: "code",
    title: "Software Engineering",
    description:
      "Scalable, secure, and performant systems built with modern technologies and best practices.",
  },
  {
    icon: "chart",
    title: "Data & Analytics",
    description:
      "Turn raw data into actionable insight with dashboards, reporting, and predictive models.",
  },
  {
    icon: "cloud",
    title: "Cloud Infrastructure",
    description:
      "Cloud-native architecture, DevOps automation, and infrastructure that grows with you.",
  },
  {
    icon: "shield",
    title: "Security & Compliance",
    description:
      "Protect your business with proactive security audits, monitoring, and compliance support.",
  },
];

export const getHomePage = async (req, res) => {
  try {
    return res.render("index", {
      title: "SPMG — Building the future of business",
      page: "home",
      services,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

export const getAboutPage = async (req, res) => {
  try {
    return res.render("about", {
      title: "About — SPMG",
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
      title: "Services — SPMG",
      page: "services",
      services,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};
