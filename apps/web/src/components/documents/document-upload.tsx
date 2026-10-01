"use client";

import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  client?: { name: string };
}

interface DocumentUploadProps {
  clients?: any[];
  orders?: any[];
}

export function DocumentUpload({ clients, orders: initialOrders }: DocumentUploadProps = {}) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>(initialOrders || []);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [loadingOrders, setLoadingOrders] = useState(!initialOrders);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Load orders on component mount
  useEffect(() => {
    if (initialOrders && initialOrders.length > 0) {
      setOrders(initialOrders);
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    apiClient
      .get("/orders?take=200")
      .then((res) => {
        setOrders(res.data || []);
      })
      .catch(() => {
        setError("Errore nel caricamento degli ordini");
      })
      .finally(() => setLoadingOrders(false));
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (!selectedOrderId) {
      setError("Seleziona un ordine per allegare i documenti");
      return;
    }
    
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        
        await apiClient.post(
          `/documents/upload?orderId=${selectedOrderId}&type=ORDER`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }
      setSuccess(`${files.length} file caricati con successo all'ordine`);
      setFiles([]);
      setSelectedOrderId("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore durante l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Order selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ordine <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          disabled={loadingOrders}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">-- Seleziona ordine --</option>
          {loadingOrders && <option disabled>Caricamento...</option>}
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.orderNumber} {order.client?.name && `(${order.client.name})`}
            </option>
          ))}
        </select>
        {!selectedOrderId && files.length > 0 && (
          <p className="text-red-500 text-xs mt-1">Seleziona un ordine prima di caricare</p>
        )}
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
          dragActive
            ? "border-emerald-500 bg-emerald-50"
            : "border-gray-300 bg-white hover:border-gray-400"
        )}
      >
        <Upload className={cn("mb-4 h-12 w-12", dragActive ? "text-emerald-500" : "text-gray-400")} />
        <p className="text-lg font-medium text-gray-700">
          {dragActive ? "Rilascia i file qui" : "Trascina i file qui"}
        </p>
        <p className="mt-1 text-sm text-gray-500">oppure</p>
        <label className="mt-4 cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Seleziona file
          <input type="file" multiple className="hidden" onChange={handleFileSelect} />
        </label>
        <p className="mt-4 text-xs text-gray-400">PDF, JPG, PNG, Excel fino a 50MB</p>
      </div>

      {files.length > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-medium text-gray-700">File selezionati ({files.length})</p>
          <div className="space-y-2">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button onClick={() => removeFile(idx)} className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedOrderId}
            className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Caricamento..." : "Carica Tutti"}
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle className="h-5 w-5" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <X className="h-5 w-5" /> {error}
        </div>
      )}
    </div>
  );
}
