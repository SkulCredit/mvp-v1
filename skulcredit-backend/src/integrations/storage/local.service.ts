
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import env from '../../config/env';
import logger from '../../config/logger';

class LocalStorageService {
  private readonly uploadsDir: string;

  constructor() {
    this.uploadsDir = path.resolve(process.cwd(), env.uploads.dir);
    this.ensureDir(this.uploadsDir);
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created uploads directory: ${dir}`);
    }
  }

  /**
   * @param buffer      File contents
   * @param originalName Original filename (used to preserve extension)
   * @param folder      Sub-folder inside uploadsDir, e.g. "photos" | "kyc_docs"
   * @returns `{ filePath, publicUrl }`
   */
  saveFile(
    buffer: Buffer,
    originalName: string,
    folder = 'documents',
  ): { filePath: string; publicUrl: string } {
    const folderDir = path.join(this.uploadsDir, folder);
    this.ensureDir(folderDir);

    const ext      = path.extname(originalName).toLowerCase();
    const safeName = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60);
    const fileName = `${uuidv4()}-${safeName}${ext}`;
    const absPath  = path.join(folderDir, fileName);

    fs.writeFileSync(absPath, buffer);
    logger.debug(`File saved: ${absPath}`);
    const filePath  = path.join('uploads', folder, fileName).replace(/\\/g, '/');
    const publicUrl = `${env.appUrl.replace(/\/$/, '')}/${filePath}`;

    return { filePath, publicUrl };
  }

  deleteFile(filePath: string): void {
    try {
      const absPath = path.resolve(process.cwd(), filePath);
      if (fs.existsSync(absPath)) {
        fs.unlinkSync(absPath);
        logger.debug(`File deleted: ${absPath}`);
      }
    } catch (err) {
      logger.warn(`Failed to delete file ${filePath}: ${(err as Error).message}`);
    }
  }
}

export default new LocalStorageService();
