import prisma from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// Prevent static pre-rendering — this route requires a live DB connection
export const dynamic = "force-dynamic";

/**
 * GET /api/sql/schema
 * Returns database schema (tables and columns) from information_schema
 */
export async function GET() {
  try {
    // Get all tables in public schema
    const tables = (await prisma.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)) as Array<{ table_name: string }>;

    // Get all columns for public schema tables
    const columns = (await prisma.$queryRawUnsafe(`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `)) as Array<{
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
      character_maximum_length: number | null;
    }>;

    // Group columns by table
    const schema = tables.map((t) => ({
      name: t.table_name,
      columns: columns
        .filter((c) => c.table_name === t.table_name)
        .map((c) => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable === "YES",
          default: c.column_default,
          maxLength: c.character_maximum_length,
        })),
    }));

    return apiResponse({ schema });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch schema";
    return apiError(message, 500);
  }
}
