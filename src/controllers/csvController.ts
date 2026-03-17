import { Request, Response, NextFunction } from "express";
import { parse } from "csv-parse/sync";
import { AppError } from "../middleware/errorHandler";
import { ApiResponse } from "../types";
import pool from "../db";

const USER_COLUMNS = [
  "first_name",
  "last_name",
  "email",
  "gender",
  "ip_address",
  "company",
  "city",
  "title",
  "website",
] as const;

type UserRow = Record<(typeof USER_COLUMNS)[number], string>;

interface CsvImportResult {
  rows: Record<string, string>[];
  columns: string[];
  pagination: {
    page: number;
    limit: number;
    totalRows: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// In-memory store for paginating already-saved data
const csvStore = new Map<string, Record<string, string>[]>();

export const importCsv = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.file) {
    return next(
      new AppError(
        'No file uploaded. Send a CSV as form-data with key "file"',
        400,
      ),
    );
  }

  try {
    const parsed = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    if (parsed.length === 0) {
      return next(new AppError("CSV file is empty or has no data rows", 400));
    }

    // Insert values, only picking known columns (skip id — auto increment)
    const values = parsed.map((row) =>
      USER_COLUMNS.map((col) => row[col] ?? null),
    );

    const placeholders = values
      .map(() => `(${USER_COLUMNS.map(() => "?").join(", ")})`)
      .join(", ");
    const flatValues = values.flat();

    const sql = `INSERT INTO users (${USER_COLUMNS.join(", ")}) VALUES ${placeholders}`;
    await pool.execute(sql, flatValues);

    // Store for pagination
    const dataId = `csv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    csvStore.set(dataId, parsed);

    const page = 1;
    const limit = parseInt((req.query.limit as string) ?? "10", 10);
    const totalRows = parsed.length;
    const totalPages = Math.ceil(totalRows / limit);
    const paginatedRows = parsed.slice(0, limit);
    const columns = ["id", ...USER_COLUMNS];

    const response: ApiResponse<
      CsvImportResult & { dataId: string; saved: number }
    > = {
      success: true,
      message: `Parsed and saved ${totalRows} row(s) to the users table.`,
      data: {
        dataId,
        saved: totalRows,
        columns,
        rows: paginatedRows,
        pagination: {
          page,
          limit,
          totalRows,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: false,
        },
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(new AppError(`Failed to import CSV: ${(err as Error).message}`, 500));
  }
};

export const getCsvPage = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { dataId } = req.params;
  const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
  const limit = Math.max(1, parseInt((req.query.limit as string) ?? "10", 10));

  const rows = csvStore.get(dataId);
  if (!rows) {
    return next(
      new AppError("Data not found. Please re-upload your CSV.", 404),
    );
  }

  const totalRows = rows.length;
  const totalPages = Math.ceil(totalRows / limit);
  const start = (page - 1) * limit;
  const paginatedRows = rows.slice(start, start + limit);

  if (paginatedRows.length === 0) {
    return next(
      new AppError(
        `Page ${page} does not exist. Total pages: ${totalPages}`,
        400,
      ),
    );
  }

  const response: ApiResponse<CsvImportResult> = {
    success: true,
    data: {
      columns: ["id", ...USER_COLUMNS],
      rows: paginatedRows,
      pagination: {
        page,
        limit,
        totalRows,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  };

  res.status(200).json(response);
};
