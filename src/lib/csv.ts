export const CSV_EXPORT_COLUMNS = [
  "anonymousParticipantId",
  "dataType",
  "studyVersion",
  "scenarioVersion",
  "sessionId",
  "groupAssignment",
  "testForm",
  "phase",
  "scenarioId",
  "scenarioType",
  "visualVariantId",
  "displayedCharacterOrder",
  "scenarioStartedAt",
  "firstChoice",
  "firstConfidence",
  "firstReason",
  "firstSubmittedAt",
  "clueViewedAt",
  "secondDecisionMode",
  "secondChoice",
  "secondConfidence",
  "secondSubmittedAt",
  "interpretationBefore",
  "interpretationAfter",
  "completionStatus",
] as const;

export type CsvExportRow = Record<(typeof CSV_EXPORT_COLUMNS)[number], string | number | null | undefined>;

export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Protect against spreadsheet formula injection while keeping Turkish characters intact
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\r\n;]/.test(safe)) {
    return `"${safe.replaceAll('"', '""')}"`;
  }
  return safe;
}

/**
 * Generates an RFC-4180 UTF-8 CSV string with optional Excel-compatible UTF-8 BOM (\uFEFF).
 * Strictly excludes any real personal identity fields.
 */
export function buildAnonymousCsv(
  rows: CsvExportRow[],
  options: { includeBom?: boolean } = {},
): string {
  const header = CSV_EXPORT_COLUMNS.join(",");
  const lines = rows.map((row) =>
    CSV_EXPORT_COLUMNS.map((col) => escapeCsvCell(row[col])).join(","),
  );
  const content = [header, ...lines].join("\r\n");
  return options.includeBom ? `\uFEFF${content}` : content;
}
