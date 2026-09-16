"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { ingestPostMetricRow } from "@/lib/ingest/post-metrics";
import { ingestAccountMetricRow } from "@/lib/ingest/account-metrics";

export type ImportSummary = {
  total: number;
  successCount: number;
  errors: { row: number; message: string }[];
};

export type ImportActionResult = { error: string } | { summary: ImportSummary };

async function readCsvFile(
  formData: FormData
): Promise<{ rows: Record<string, string>[] } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Bitte eine CSV-Datei auswählen." };
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    return { error: `CSV konnte nicht gelesen werden: ${parsed.errors[0].message}` };
  }
  if (parsed.data.length === 0) {
    return { error: "Die CSV-Datei enthält keine Zeilen." };
  }

  return { rows: parsed.data };
}

export async function importPostMetricsCsv(
  formData: FormData
): Promise<ImportActionResult> {
  const parsed = await readCsvFile(formData);
  if ("error" in parsed) return { error: parsed.error };

  const errors: { row: number; message: string }[] = [];
  let successCount = 0;

  for (let i = 0; i < parsed.rows.length; i++) {
    const raw = parsed.rows[i];
    const rowNumber = i + 2; // account for the header line
    const result = await ingestPostMetricRow({
      accountUsername: raw.account_username ?? "",
      postUrl: raw.post_url || null,
      postExternalId: raw.post_external_id || null,
      date: raw.date ?? "",
      views: Number(raw.views),
      likes: Number(raw.likes),
      comments: Number(raw.comments),
      shares: raw.shares ? Number(raw.shares) : null,
      saves: raw.saves ? Number(raw.saves) : null,
    });

    if (result.success) {
      successCount++;
    } else {
      errors.push({ row: rowNumber, message: result.error });
    }
  }

  revalidatePath("/accounts");
  return {
    summary: { total: parsed.rows.length, successCount, errors },
  };
}

export async function importAccountMetricsCsv(
  formData: FormData
): Promise<ImportActionResult> {
  const parsed = await readCsvFile(formData);
  if ("error" in parsed) return { error: parsed.error };

  const errors: { row: number; message: string }[] = [];
  let successCount = 0;

  for (let i = 0; i < parsed.rows.length; i++) {
    const raw = parsed.rows[i];
    const rowNumber = i + 2;
    const result = await ingestAccountMetricRow({
      accountUsername: raw.account_username ?? "",
      date: raw.date ?? "",
      followers: Number(raw.followers),
      totalViews: raw.total_views ? Number(raw.total_views) : null,
    });

    if (result.success) {
      successCount++;
    } else {
      errors.push({ row: rowNumber, message: result.error });
    }
  }

  revalidatePath("/accounts");
  return {
    summary: { total: parsed.rows.length, successCount, errors },
  };
}
