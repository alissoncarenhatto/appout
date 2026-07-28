import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";

type UploadCategory = "vehicles" | "tenants" | "workorders" | "estimates";

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabaseUrl: string | null;
  private readonly supabaseKey: string | null;
  private readonly bucket: string;
  private readonly client: SupabaseClient | null;

  constructor(private readonly configService: ConfigService) {
    this.supabaseUrl =
      this.configService.get<string>("SUPABASE_URL")?.trim() || null;
    this.supabaseKey =
      this.configService.get<string>("SUPABASE_PUBLISHABLE_KEY")?.trim() ||
      this.configService.get<string>("SUPABASE_ANON_KEY")?.trim() ||
      null;
    this.bucket =
      this.configService.get<string>("SUPABASE_STORAGE_BUCKET")?.trim() ||
      "appout-storage";

    this.client =
      this.supabaseUrl && this.supabaseKey
        ? createClient(this.supabaseUrl, this.supabaseKey)
        : null;
  }

  isProduction() {
    return this.configService.get<string>("NODE_ENV") === "production";
  }

  async uploadLocalFile(
    category: UploadCategory,
    filePath: string,
    filename: string,
    contentType?: string | null,
  ) {
    const buffer = await fs.promises.readFile(filePath);

    try {
      return await this.uploadBuffer(category, buffer, filename, contentType);
    } finally {
      await this.deleteLocalFile(filePath);
    }
  }

  async uploadBuffer(
    category: UploadCategory,
    buffer: Buffer,
    filename: string,
    contentType?: string | null,
  ) {
    if (!this.isProduction()) {
      throw new InternalServerErrorException(
        "Supabase upload is available only in production mode",
      );
    }

    if (!this.client) {
      throw new InternalServerErrorException(
        "Supabase storage is not configured",
      );
    }

    const objectPath = `${category}/${filename}`;
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(objectPath, buffer, {
        contentType: contentType ?? undefined,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Supabase upload failed for ${objectPath}`, error);
      throw new InternalServerErrorException(
        "Failed to upload file to Supabase storage",
      );
    }

    const { data } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(objectPath);
    return data.publicUrl;
  }

  private async deleteLocalFile(filePath: string) {
    try {
      await fs.promises.unlink(filePath);
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        this.logger.warn(`Could not remove temporary file ${filePath}`);
      }
    }
  }
}
