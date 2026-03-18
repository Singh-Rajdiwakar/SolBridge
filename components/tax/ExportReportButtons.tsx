"use client";

import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ExportReportButtons({
  onExport,
  loading,
}: {
  onExport: (format: "json" | "csv" | "pdf") => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => onExport("pdf")} disabled={loading}>
        <FileText className="h-4 w-4" />
        PDF
      </Button>
      <Button variant="secondary" onClick={() => onExport("csv")} disabled={loading}>
        <FileSpreadsheet className="h-4 w-4" />
        CSV
      </Button>
      <Button variant="secondary" onClick={() => onExport("json")} disabled={loading}>
        <FileJson className="h-4 w-4" />
        JSON
      </Button>
      <Button variant="ghost" onClick={() => onExport("json")} disabled={loading}>
        <Download className="h-4 w-4" />
        Quick Export
      </Button>
    </div>
  );
}
