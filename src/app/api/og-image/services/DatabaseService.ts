import sql from '../../../../lib/db';
import { GenerationMetadata, StoredGeneration } from '../types';

export interface OGGenerationRecord {
  id: string;
  seed: string;
  aspect_ratio: string;
  quote_text?: string;
  quote_author?: string;
  custom_width?: number;
  custom_height?: number;
  shape_count?: number;
  client_ip?: string;
  user_agent?: string;
  svg_content?: string;
  width?: number;
  height?: number;
  created_at: Date;
}

export interface CreateOGGenerationParams {
  seed: string;
  aspectRatio: string;
  quoteText?: string;
  quoteAuthor?: string;
  customWidth?: number;
  customHeight?: number;
  shapeCount?: number;
  ipAddress: string;
  userAgent: string;
  svgContent: string;
  width: number;
  height: number;
  generationOptions?: any; // Full generation config object
  machineFingerprint?: string;
  fingerprintData?: any; // Full fingerprint data
}

interface OGGeneration {
  id: string;
  seed: string;
  aspect_ratio: string;
  quote_text: string | null;
  quote_author: string | null;
  custom_width: number | null;
  custom_height: number | null;
  shape_count: number | null;
  client_ip: string;
  user_agent: string;
  svg_content: string;
  width: number;
  height: number;
  generation_options: any;
  created_at: Date;
  updated_at: Date;
}

export class DatabaseService {
  private static instance: DatabaseService;

  // Use singleton pattern with shared database connection
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private constructor() {
    // Private constructor for singleton pattern
  }

  private isDatabaseAvailable(): boolean {
    // Never connect to database during build time
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PHASE === 'phase-production-build'
    ) {
      return false;
    }

    // Skip database in development if specified
    if (process.env.SKIP_DATABASE === 'true') {
      return false;
    }

    // Check if required environment variables are present
    return !!(
      process.env.POSTGRES_HOST &&
      process.env.POSTGRES_USER &&
      process.env.POSTGRES_DB &&
      process.env.POSTGRES_PASSWORD
    );
  }

  // New OG Generation tracking methods
  public async recordGeneration(
    params: CreateOGGenerationParams
  ): Promise<string> {
    if (!this.isDatabaseAvailable()) {
      throw new Error('Database not available');
    }

    try {
      const result = await sql<OGGeneration[]>`
        INSERT INTO og_generations (
          seed, aspect_ratio, quote_text, quote_author, custom_width, custom_height, 
          shape_count, client_ip, user_agent, svg_content, width, height, generation_options
        ) VALUES (
          ${params.seed}, ${params.aspectRatio}, ${params.quoteText || null}, 
          ${params.quoteAuthor || null}, ${params.customWidth || null}, 
          ${params.customHeight || null}, ${params.shapeCount || null}, 
          ${params.ipAddress}, ${params.userAgent}, ${params.svgContent}, 
          ${params.width}, ${params.height}, ${JSON.stringify(params.generationOptions || {})}
        )
        RETURNING id
              `;

      return result[0]?.id || '';
    } catch (error) {
      console.error('Failed to record generation:', error);
      throw error;
    }
  }

  public async getOGGenerationById(
    id: string
  ): Promise<OGGenerationRecord | null> {
    if (!this.isDatabaseAvailable()) {
      return null;
    }

    try {
      const result = await sql<OGGeneration[]>`
        SELECT * FROM og_generations WHERE id = ${id}
      `;
      return (result[0] as OGGenerationRecord) || null;
    } catch (error) {
      console.error('Failed to get generation by ID:', error);
      return null;
    }
  }

  public async getOGGenerationsBySeed(
    seed: string,
    limit: number = 10
  ): Promise<OGGenerationRecord[]> {
    if (!this.isDatabaseAvailable()) {
      return [];
    }

    try {
      const result = await sql<OGGeneration[]>`
        SELECT * FROM og_generations 
        WHERE seed = ${seed}
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;
      return result as unknown as OGGenerationRecord[];
    } catch (error) {
      console.error('Failed to get generations by seed:', error);
      return [];
    }
  }

  public async getDailyGenerationCount(
    ipAddress: string,
    machineFingerprint?: string
  ): Promise<number> {
    if (!this.isDatabaseAvailable()) {
      return 0; // If database not available, allow generations
    }

    try {
      // If we have a machine fingerprint, use fuzzy matching
      if (machineFingerprint) {
        const result = await sql<{ count: string }[]>`
          SELECT COUNT(*) as count 
          FROM og_generations 
          WHERE (
            client_ip = ${ipAddress} 
            OR machine_fingerprint = ${machineFingerprint}
            OR fingerprint_data->>'ipHash' = (
              SELECT fingerprint_data->>'ipHash' 
              FROM og_generations 
              WHERE machine_fingerprint = ${machineFingerprint} 
              LIMIT 1
            )
          )
          AND created_at >= CURRENT_DATE
        `;
        return parseInt(result[0]?.count || '0', 10);
      }

      // Fallback to IP-only checking
      const result = await sql<{ count: string }[]>`
        SELECT COUNT(*) as count 
        FROM og_generations 
        WHERE client_ip = ${ipAddress} 
        AND created_at >= CURRENT_DATE
      `;

      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      console.error('Failed to get daily generation count:', error);
      return 0; // On error, allow generations
    }
  }

  public async getOGGenerationStats(): Promise<{
    total: number;
    today: number;
    uniqueSeeds: number;
    topAspectRatios: Array<{ aspect_ratio: string; count: number }>;
  } | null> {
    if (!this.isDatabaseAvailable()) {
      return null;
    }

    try {
      const [totalResult, todayResult, uniqueSeedsResult, topRatiosResult] =
        await Promise.all([
          sql`SELECT COUNT(*) as total FROM og_generations`,
          sql`SELECT COUNT(*) as today FROM og_generations WHERE created_at >= CURRENT_DATE`,
          sql`SELECT COUNT(DISTINCT seed) as unique_seeds FROM og_generations`,
          sql`
          SELECT aspect_ratio, COUNT(*) as count 
          FROM og_generations 
          GROUP BY aspect_ratio 
          ORDER BY count DESC 
          LIMIT 5
        `
        ]);

      return {
        total: parseInt(totalResult[0]?.total || '0'),
        today: parseInt(todayResult[0]?.today || '0'),
        uniqueSeeds: parseInt(uniqueSeedsResult[0]?.unique_seeds || '0'),
        topAspectRatios: topRatiosResult as unknown as Array<{
          aspect_ratio: string;
          count: number;
        }>
      };
    } catch (error) {
      console.error('Failed to get generation stats:', error);
      return null;
    }
  }

  // Legacy stored generation methods (kept for compatibility)
  async storeGeneration(
    metadata: GenerationMetadata,
    svgContent: string
  ): Promise<string> {
    if (!this.isDatabaseAvailable()) {
      throw new Error('Database not configured');
    }

    try {
      const result = await sql`
        INSERT INTO stored_generations (
          seed, quote_text, quote_author, avatar_seed, 
          client_ip, user_agent, svg_content, metadata
        ) VALUES (
          ${metadata.seed},
          ${metadata.quote?.text || null},
          ${metadata.quote?.author || null},
          ${metadata.seed},
          ${metadata.clientInfo.ip},
          ${metadata.clientInfo.userAgent},
          ${svgContent},
          ${JSON.stringify(metadata)}
        )
        RETURNING id
      `;
      return result[0].id;
    } catch (error) {
      console.error('Failed to store generation:', error);
      throw error;
    }
  }

  async getGeneration(id: string): Promise<{
    id: string;
    seed: string;
    aspectRatio: string;
    svg: string;
    dimensions: { width: number; height: number };
    generationOptions: any;
    createdAt: Date;
  } | null> {
    if (!this.isDatabaseAvailable()) {
      throw new Error('Database not available');
    }

    try {
      const result = await sql<OGGeneration[]>`
        SELECT * FROM og_generations WHERE id = ${id} LIMIT 1
      `;

      if (result.length === 0) {
        return null;
      }

      const generation = result[0];
      return {
        id: generation.id,
        seed: generation.seed,
        aspectRatio: generation.aspect_ratio,
        svg: generation.svg_content,
        dimensions: {
          width: generation.width,
          height: generation.height
        },
        generationOptions: generation.generation_options || {},
        createdAt: generation.created_at
      };
    } catch (error) {
      console.error('Failed to get generation:', error);
      throw error;
    }
  }

  async getRecentGenerations(
    clientIp: string,
    limit: number = 10
  ): Promise<Omit<StoredGeneration, 'svg_content'>[]> {
    if (!this.isDatabaseAvailable()) {
      return [];
    }

    try {
      const result = await sql`
        SELECT id, seed, quote_text, quote_author, avatar_seed, 
               client_ip, user_agent, metadata, created_at
        FROM stored_generations 
        WHERE client_ip = ${clientIp}
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;
      return result as unknown as Omit<StoredGeneration, 'svg_content'>[];
    } catch (error) {
      console.error('Failed to get recent generations:', error);
      return [];
    }
  }

  async countGenerations(
    clientIp: string,
    userAgent: string,
    hoursBack: number
  ): Promise<number> {
    if (!this.isDatabaseAvailable()) {
      return 0;
    }

    try {
      const result = await sql`
        SELECT COUNT(*) as count 
        FROM stored_generations 
        WHERE client_ip = ${clientIp}
          AND user_agent = ${userAgent}
          AND created_at > NOW() - INTERVAL '${hoursBack} hours'
      `;
      return parseInt(result[0]?.count || '0');
    } catch (error) {
      console.error('Failed to count generations:', error);
      return 0;
    }
  }

  async cleanupOldGenerations(daysOld: number = 30): Promise<number> {
    if (!this.isDatabaseAvailable()) {
      return 0;
    }

    try {
      const result = await sql`
        DELETE FROM stored_generations 
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      `;
      return result.count || 0;
    } catch (error) {
      console.error('Failed to cleanup old generations:', error);
      return 0;
    }
  }

  storedGenerationToMetadata(stored: StoredGeneration): GenerationMetadata {
    // Create metadata from stored generation
    return {
      id: stored.id,
      seed: stored.seed,
      quote: {
        text: stored.quote_text,
        author: stored.quote_author || undefined // Only include author if not null
      },
      aspectRatio: stored.aspect_ratio,
      dimensions: {
        width: stored.width,
        height: stored.height
      },
      shapeCount: stored.shape_count,
      customDimensions:
        stored.custom_width || stored.custom_height
          ? {
              width: stored.custom_width,
              height: stored.custom_height
            }
          : undefined,
      generatedAt: stored.created_at,
      clientInfo: {
        ip: stored.client_ip,
        userAgent: stored.user_agent
      }
    };
  }
}
