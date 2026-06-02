import multer from "multer";
import path from "path";
import fs from "fs";
import { MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from "../config/constant.js";

const IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const makeStorage = (subdir) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, ensureDir(path.join("public", "uploads", subdir)));
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${subdir}-${unique}${ext}`);
    },
  });

const imageOnlyFilter = (req, file, cb) => {
  if (IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Only image files (JPEG, PNG, GIF, WEBP) are allowed"));
};

const imageOrVideoFilter = (req, file, cb) => {
  if (IMAGE_TYPES.includes(file.mimetype) || VIDEO_TYPES.includes(file.mimetype))
    return cb(null, true);
  cb(new Error("Only image or video files are allowed"));
};

// Cover image for an event.
export const uploadEventCover = multer({
  storage: makeStorage("events"),
  fileFilter: imageOnlyFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single("coverImage");

// Cover image for a blog post.
export const uploadBlogCover = multer({
  storage: makeStorage("blog"),
  fileFilter: imageOnlyFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single("coverImage");

// Photo or video for the gallery.
export const uploadGalleryMedia = multer({
  storage: makeStorage("gallery"),
  fileFilter: imageOrVideoFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
}).single("mediaFile");

/**
 * Wrap a multer middleware so a file-too-large / wrong-type error becomes a
 * flash message and redirect back, instead of crashing the request.
 */
export const withUpload = (uploader, redirectTo) => (req, res, next) => {
  uploader(req, res, (err) => {
    if (err) {
      if (typeof req.flash === "function") req.flash("error", err.message);
      return res.redirect(redirectTo(req));
    }
    next();
  });
};
