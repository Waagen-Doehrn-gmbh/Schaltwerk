import { v4 as uuidv4 } from "uuid";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "chat");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export interface UploadResult {
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

export class UploadService {
  /**
   * Initialisiert das Upload-Verzeichnis falls es nicht existiert
   */
  static async ensureUploadDirectory(): Promise<void> {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Validiert eine hochgeladene Datei
   */
  static validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error("Keine Datei hochgeladen");
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(
        `Ungültiger Dateityp. Erlaubt sind: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `Datei zu groß. Maximale Größe: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }
  }

  /**
   * Speichert eine hochgeladene Datei
   */
  static async saveFile(file: Express.Multer.File): Promise<UploadResult> {
    await this.ensureUploadDirectory();

    this.validateFile(file);

    // Generiere eindeutigen Dateinamen mit UUID
    const extension = file.originalname.split(".").pop() || "jpg";
    const filename = `${uuidv4()}.${extension}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Speichere Datei
    await writeFile(filepath, file.buffer);

    // Generiere URL
    const url = `/api/uploads/chat/${filename}`;

    return {
      filename,
      url,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}


