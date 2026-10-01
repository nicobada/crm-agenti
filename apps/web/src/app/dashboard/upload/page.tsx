"use client";

import { DocumentUpload } from "@/components/documents/document-upload";

export default function UploadPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Archiviazione Documentale
        </h1>
        <p className="text-sm text-slate-500">
          Carica fatture, ricevute o documenti firmati associandoli direttamente agli ordini
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <DocumentUpload />
      </div>
    </div>
  );
}
