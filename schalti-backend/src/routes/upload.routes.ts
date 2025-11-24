import { Router } from "express";
import multer from "multer";
import { UploadController } from "../controllers/upload.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Multer Konfiguration für Memory Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Ungültiger Dateityp. Nur Bilder sind erlaubt."));
    }
  },
});

router.post(
  "/chat",
  authMiddleware,
  upload.single("image"),
  UploadController.uploadChatImage
);

export default router;



