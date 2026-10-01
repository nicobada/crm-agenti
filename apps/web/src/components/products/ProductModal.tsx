'use client';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

export default function ProductModal({ product, isOpen, onClose, onSave }: any) {
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const isActive = watch('isActive');

  useEffect(() => {
    if (product && isOpen) {
      reset({ 
        ...product, 
        basePrice: Number(product.basePrice),
        stock: Number(product.stock || 0)
      });
    } else if (isOpen) {
      reset({ name: '', sku: '', basePrice: 0, stock: 0, isActive: true, category: 'Altro' });
    }
  }, [product, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-black text-gray-800">{product ? '📦 Modifica' : '🆕 Nuovo'} Prodotto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Nome</label>
              <input {...register('name')} className="w-full border rounded-lg p-2.5 mt-1" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase">SKU</label>
              <input {...register('sku')} className="w-full border rounded-lg p-2.5 mt-1" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Prezzo</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">€</span>
                <input type="number" step="0.01" {...register('basePrice')} className="w-full border rounded-lg p-2.5 pl-7" required />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Giacenza Stock (pz)</label>
              <input type="number" {...register('stock')} className="w-full border rounded-lg p-2.5 mt-1" placeholder="0" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
            <span className="text-sm font-bold">Stato: {isActive ? '🟢 Disponibile' : '🔴 Fuori Stock'}</span>
            <button type="button" onClick={() => setValue('isActive', !isActive)} className={`w-12 h-6 rounded-full transition-all relative ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-all ${isActive ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">Salva</button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold">Annulla</button>
          </div>
        </form>
      </div>
    </div>
  );
}