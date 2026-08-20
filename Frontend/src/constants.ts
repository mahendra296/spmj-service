// UI-only constants — mirrors Backend/config/constant.js where relevant, plus
// content that used to be hardcoded server-side (pageController.js) and now
// lives purely in the Frontend since it has no DB backing.

export const SLIDER_INTERVAL_MS = 5000;

export const BLOG_CATEGORIES = ["article", "press", "announcement"] as const;
export const MEDIA_TYPES = ["image", "video"] as const;

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 5;

export interface Program {
  icon: "spark" | "layers" | "code" | "chart" | "cloud" | "shield";
  title: string;
  description: string;
}

export const PROGRAMS: Program[] = [
  {
    icon: "spark",
    title: "Free Schooling",
    description: "Full-time classes for children who would otherwise have no access to school.",
  },
  {
    icon: "layers",
    title: "After-School Learning",
    description: "Homework support and tutoring that keeps students on track between school days.",
  },
  {
    icon: "code",
    title: "Digital & STEM Labs",
    description: "Hands-on coding, robotics, and science stations led by volunteer engineers and teachers.",
  },
  {
    icon: "chart",
    title: "Scholarships",
    description: "Need-based scholarships that carry students from primary school through higher education.",
  },
  {
    icon: "cloud",
    title: "Nutrition & Meals",
    description: "Daily nutritious meals so children can focus on learning, not hunger.",
  },
  {
    icon: "shield",
    title: "Child Welfare",
    description: "Health check-ups, counselling, and family support alongside the classroom.",
  },
];
