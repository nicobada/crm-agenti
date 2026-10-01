'use client';

import { Trash2, Plus } from 'lucide-react';

export interface OrderItemRow {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

interface OrderItemsTableProps {
  items: OrderItemRow[];
  setItems: React.Dispatch<React.SetStateAction<OrderItemRow[]>>;
  products: Array<{ id: string; name: string; sku?: string; basePrice?: number | string }>;
}

export function OrderItemsTable({ items, setItems, products }: OrderItemsTableProps) {
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { productId: '', productName: '', quantity: 1, unitPrice: 0, discount: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItemRow, value: any) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const updated = { ...it, [field]: value };
        if (field === 'productId') {
          const selectedProd = products.find((p) => p.id === value);
          if (selectedProd) {
            updated.productName = selectedProd.name;
            updated.unitPrice = Number(selectedProd.basePrice || 0);
          }
        }
        return updated;
      })
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Articoli Ordine</h2>
        <button
          type="button"
          onClick={addItem}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          <Plus size={16} /> Aggiungi Riga
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Nessun articolo inserito</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-slate-400 font-bold uppercase">
                <th className="pb-2">Prodotto</th>
                <th className="pb-2 w-20">Qtà</th>
                <th className="pb-2 w-24">Prezzo (€)</th>
                <th className="pb-2 w-20">Sconto (%)</th>
                <th className="pb-2 w-10 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-2 pr-2">
                    <select
                      value={it.productId || ''}
                      onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                      className="w-full p-2 border rounded-lg outline-none"
                    >
                      <option value="">-- Seleziona prodotto o inserisci nome --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.sku ? `(${p.sku})` : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full p-2 border rounded-lg outline-none"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      step="0.01"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full p-2 border rounded-lg outline-none"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={it.discount || 0}
                      onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))}
                      className="w-full p-2 border rounded-lg outline-none"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OrderItemsTable;