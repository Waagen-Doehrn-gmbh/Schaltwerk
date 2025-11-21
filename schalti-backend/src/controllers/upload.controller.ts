import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { UploadService } from "../services/upload.service";
import { AppError } from "../middleware/error.middleware";

export class UploadController {
  static async uploadChatImage(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Keine Datei hochgeladen" });
        return;
      }

      const result = await UploadService.saveFile(req.file);

      // Generiere vollständige URL
      const protocol = req.protocol;
      const host = req.get("host");
      const fullUrl = `${protocol}://${host}${result.url}`;

      res.status(200).json({
        success: true,
        filename: result.filename,
        url: fullUrl,
        size: result.size,
        mimetype: result.mimetype,
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({
        error: error.message || "Fehler beim Hochladen der Datei",
      });
    }
  }
}

