"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProduct, useCreateProduct, useUpdateProduct, useGenerateVariants, useUpdateVariant, useDeleteVariant } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
import { useAttributes } from '@/hooks/use-attributes';
import { ArrowLeft, Save, Loader2, Package, Truck, Settings, Image as ImageIcon, Layers, Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  
  const { data: product, isLoading: isLoadingProduct } = useProduct(isNew ? '' : (params.id as string));
  const { data: categories } = useCategories();
  
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const { data: globalAttributes } = useAttributes();
  const generateVariantsMutation = useGenerateVariants();
  const updateVariantMutation = useUpdateVariant();
  const deleteVariantMutation = useDeleteVariant();

  const [selectedAttrs, setSelectedAttrs] = useState<{ attributeId: string, valueIds: string[] }[]>([]);
  const [variantEdits, setVariantEdits] = useState<Record<string, any>>({});

  const handleVariantEditChange = (variantId: string, field: string, value: any) => {
    setVariantEdits(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value
      }
    }));
  };

  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      const tempAttrs: Record<string, Set<string>> = {};
      product.variants.forEach((v: any) => {
        v.attributes?.forEach((va: any) => {
          if (!tempAttrs[va.attributeId]) {
            tempAttrs[va.attributeId] = new Set();
          }
          tempAttrs[va.attributeId].add(va.attributeValueId);
        });
      });

      const initialAttrs = Object.keys(tempAttrs).map(attrId => ({
        attributeId: attrId,
        valueIds: Array.from(tempAttrs[attrId])
      }));
      setSelectedAttrs(initialAttrs);
    }
  }, [product]);

  const [activeTab, setActiveTab] = useState('general');
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '', sku: '', slug: '', description: '', shortDescription: '',
    regularPrice: '', salePrice: '', manageStock: false, stockQuantity: 0,
    status: 'DRAFT', visibility: 'PUBLIC', type: 'SIMPLE',
    weight: '', length: '', width: '', height: '', categoryId: ''
  });

  useEffect(() => {
    if (product && !isNew) {
      setFormData({
        ...product,
        regularPrice: product.regularPrice || '',
        salePrice: product.salePrice || '',
        weight: product.weight || '',
        length: product.length || '',
        width: product.width || '',
        height: product.height || '',
        categoryId: product.categoryId || '',
        manageStock: product.manageStock || false,
        stockQuantity: product.stockQuantity || 0,
      });
    }
  }, [product, isNew]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isNew) return;
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    setImageUploading(true);
    try {
      await apiClient.post(`/products/${params.id}/images/upload`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Refresh product data to show new image
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Errore nel caricamento immagine');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = async () => {
    const payload = {
      ...formData,
      regularPrice: formData.regularPrice ? Number(formData.regularPrice) : undefined,
      salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
      stockQuantity: formData.stockQuantity ? Number(formData.stockQuantity) : 0,
      weight: formData.weight ? Number(formData.weight) : undefined,
      length: formData.length ? Number(formData.length) : undefined,
      width: formData.width ? Number(formData.width) : undefined,
      height: formData.height ? Number(formData.height) : undefined,
    };

    if (isNew) {
      await createMutation.mutateAsync(payload);
    } else {
      await updateMutation.mutateAsync({ id: params.id as string, payload });
    }
    router.push('/dashboard/products');
  };

  if (isLoadingProduct && !isNew) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 bg-slate-50 min-h-screen pb-24">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="p-2 bg-white border rounded-xl hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} className="text-slate-600"/>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{isNew ? 'Nuovo Prodotto' : 'Modifica Prodotto'}</h1>
            <p className="text-slate-500 text-sm">Gestione completa scheda prodotto</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isPending}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          {isPending ? <Loader2 size={20} className="animate-spin"/> : <Save size={20} />}
          Salva Modifiche
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content (Tabs) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Nome del prodotto" 
              className="w-full text-2xl font-bold outline-none placeholder:text-slate-300 mb-2" 
            />
            <div className="flex items-center text-sm text-slate-500 gap-2">
              <span>Slug:</span>
              <input 
                name="slug" 
                value={formData.slug} 
                onChange={handleChange} 
                className="flex-1 outline-none font-mono text-xs bg-slate-50 px-2 py-1 rounded" 
                placeholder="Lascia vuoto per autogenerare"
              />
            </div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
            {/* Tabs Sidebar */}
            <div className="w-full md:w-48 bg-slate-50 border-r flex flex-row md:flex-col p-2 gap-1 overflow-x-auto">
              <button onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                <Package size={16}/> Generale
              </button>
              <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                <Package size={16}/> Inventario
              </button>
              <button onClick={() => setActiveTab('shipping')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'shipping' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                <Truck size={16}/> Spedizione
              </button>
              <button onClick={() => setActiveTab('advanced')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'advanced' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                <Settings size={16}/> Avanzate
              </button>
              {formData.type === 'VARIABLE' && (
                <button onClick={() => setActiveTab('variants')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'variants' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                  <Layers size={16}/> Varianti
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6">
              {activeTab === 'general' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prezzo di listino (€)</label>
                      <input type="number" step="0.01" name="regularPrice" value={formData.regularPrice} onChange={handleChange} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prezzo in saldo (€)</label>
                      <input type="number" step="0.01" name="salePrice" value={formData.salePrice} onChange={handleChange} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Breve Descrizione</label>
                    <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} rows={3} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU</label>
                    <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full p-2.5 border rounded-lg outline-none font-mono focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="manageStock" checked={formData.manageStock} onChange={handleChange} className="w-4 h-4 text-emerald-600 rounded" />
                    <span className="text-sm font-medium text-slate-700">Gestisci a livello di prodotto (quantità stock)</span>
                  </label>
                  {formData.manageStock && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantità disponibile</label>
                      <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso (kg)</label>
                    <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lunghezza</label>
                      <input type="number" step="0.1" name="length" value={formData.length} onChange={handleChange} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Larghezza</label>
                      <input type="number" step="0.1" name="width" value={formData.width} onChange={handleChange} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Altezza</label>
                      <input type="number" step="0.1" name="height" value={formData.height} onChange={handleChange} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo Prodotto</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                      <option value="SIMPLE">Semplice</option>
                      <option value="VARIABLE">Variabile</option>
                      <option value="VIRTUAL">Virtuale</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'variants' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {isNew ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
                      <AlertCircle size={18} /> Salva prima il prodotto per abilitare la generazione delle varianti.
                    </div>
                  ) : (
                    <>
                      {/* Generatore Varianti */}
                      <div className="border rounded-xl p-4 bg-slate-50 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm">Genera Varianti</h3>
                        
                        <div className="space-y-3">
                          {/* Dropdown to add attribute */}
                          <div className="flex gap-2 items-center">
                            <select 
                              id="add-attribute-select"
                              className="p-2 border rounded-lg text-sm bg-white outline-none"
                              defaultValue=""
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val && !selectedAttrs.some(a => a.attributeId === val)) {
                                  setSelectedAttrs(prev => [...prev, { attributeId: val, valueIds: [] }]);
                                }
                                e.target.value = "";
                              }}
                            >
                              <option value="">+ Aggiungi Attributo per Varianti...</option>
                              {globalAttributes?.map((attr: any) => (
                                <option key={attr.id} value={attr.id}>{attr.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Configured attributes */}
                          {selectedAttrs.map((sa) => {
                            const attrObj = globalAttributes?.find((a: any) => a.id === sa.attributeId);
                            if (!attrObj) return null;
                            return (
                              <div key={sa.attributeId} className="bg-white p-3 rounded-lg border space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-sm text-slate-700">{attrObj.name}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => setSelectedAttrs(prev => prev.filter(x => x.attributeId !== sa.attributeId))}
                                    className="text-red-500 hover:text-red-700 text-xs"
                                  >
                                    Rimuovi
                                  </button>
                                </div>
                                
                                {/* Attribute values checkboxes */}
                                <div className="flex flex-wrap gap-3">
                                  {attrObj.values?.map((val: any) => {
                                    const isChecked = sa.valueIds.includes(val.id);
                                    return (
                                      <label key={val.id} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                        <input 
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            const checked = e.target.checked;
                                            setSelectedAttrs(prev => prev.map(x => {
                                              if (x.attributeId === sa.attributeId) {
                                                return {
                                                  ...x,
                                                  valueIds: checked 
                                                    ? [...x.valueIds, val.id]
                                                    : x.valueIds.filter(id => id !== val.id)
                                                };
                                              }
                                              return x;
                                            }));
                                          }}
                                          className="rounded text-emerald-600 focus:ring-emerald-500/20"
                                        />
                                        <span>{val.value}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button 
                          type="button"
                          onClick={async () => {
                            if (selectedAttrs.length === 0 || selectedAttrs.some(a => a.valueIds.length === 0)) {
                              alert("Seleziona almeno un attributo e almeno un valore per ciascuno.");
                              return;
                            }
                            try {
                              await generateVariantsMutation.mutateAsync({ 
                                productId: product.id, 
                                attributes: selectedAttrs 
                              });
                              alert("Varianti generate con successo!");
                            } catch (err: any) {
                              alert(err.response?.data?.message || "Errore nella generazione varianti");
                            }
                          }}
                          disabled={generateVariantsMutation.isPending}
                          className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                        >
                          {generateVariantsMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14} />}
                          Genera Combinazioni Varianti
                        </button>
                      </div>

                      {/* Elenco Varianti Esistenti */}
                      <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm">Varianti Disponibili ({product.variants?.length || 0})</h3>
                        
                        <div className="border rounded-xl overflow-hidden bg-white">
                          <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase tracking-wider">
                              <tr>
                                <th className="p-3">Variante</th>
                                <th className="p-3 w-28">SKU</th>
                                <th className="p-3 w-24">Prezzo (€)</th>
                                <th className="p-3 w-24">Sconto (€)</th>
                                <th className="p-3 w-20">Stock</th>
                                <th className="p-3 w-20 text-right">Azioni</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {product.variants?.map((v: any) => {
                                const attrText = v.attributes?.map((a: any) => a.attributeValue?.value).join(' / ') || 'Variante';
                                
                                const getVal = (field: string) => {
                                  return variantEdits[v.id]?.[field] !== undefined 
                                    ? variantEdits[v.id][field] 
                                    : (v[field] ?? '');
                                };

                                const isModified = variantEdits[v.id] && Object.keys(variantEdits[v.id]).length > 0;

                                return (
                                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-semibold text-slate-700">{attrText}</td>
                                    <td className="p-3">
                                      <input 
                                        type="text" 
                                        value={getVal('sku')} 
                                        onChange={(e) => handleVariantEditChange(v.id, 'sku', e.target.value)}
                                        className="w-full p-1 border rounded font-mono text-[11px] outline-none focus:border-emerald-500" 
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={getVal('price')} 
                                        onChange={(e) => handleVariantEditChange(v.id, 'price', e.target.value)}
                                        className="w-full p-1 border rounded text-right outline-none focus:border-emerald-500" 
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={getVal('salePrice')} 
                                        onChange={(e) => handleVariantEditChange(v.id, 'salePrice', e.target.value)}
                                        className="w-full p-1 border rounded text-right outline-none focus:border-emerald-500" 
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input 
                                        type="number" 
                                        value={getVal('stockQuantity')} 
                                        onChange={(e) => handleVariantEditChange(v.id, 'stockQuantity', parseInt(e.target.value) || 0)}
                                        className="w-full p-1 border rounded text-center outline-none focus:border-emerald-500" 
                                      />
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex justify-end gap-1.5">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (!isModified) return;
                                            try {
                                              await updateVariantMutation.mutateAsync({
                                                productId: product.id,
                                                variantId: v.id,
                                                payload: variantEdits[v.id]
                                              });
                                              setVariantEdits(prev => {
                                                const next = { ...prev };
                                                delete next[v.id];
                                                return next;
                                              });
                                              alert("Variante salvata!");
                                            } catch (err: any) {
                                              alert(err.response?.data?.message || "Errore nel salvataggio");
                                            }
                                          }}
                                          disabled={!isModified || updateVariantMutation.isPending}
                                          className={`p-1.5 rounded transition-colors ${
                                            isModified 
                                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                              : 'text-slate-300 cursor-not-allowed'
                                          }`}
                                          title="Salva modifiche"
                                        >
                                          <Save size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (confirm("Vuoi eliminare questa variante?")) {
                                              try {
                                                await deleteVariantMutation.mutateAsync({
                                                  productId: product.id,
                                                  variantId: v.id
                                                });
                                              } catch (err: any) {
                                                alert(err.response?.data?.message || "Errore nella cancellazione");
                                              }
                                            }
                                          }}
                                          disabled={deleteVariantMutation.isPending}
                                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Elimina variante"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}

                              {(!product.variants || product.variants.length === 0) && (
                                <tr>
                                  <td colSpan={6} className="p-8 text-center text-slate-400">
                                    Nessuna variante generata. Aggiungi gli attributi sopra e clicca su "Genera Combinazioni".
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2">Pubblicazione</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stato</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none bg-white text-sm">
                <option value="PUBLISHED">Pubblicato</option>
                <option value="DRAFT">Bozza</option>
                <option value="PENDING">In attesa di revisione</option>
                <option value="ARCHIVED">Archiviato</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Visibilità</label>
              <select name="visibility" value={formData.visibility} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none bg-white text-sm">
                <option value="PUBLIC">Pubblico</option>
                <option value="PRIVATE">Privato</option>
                <option value="HIDDEN">Nascosto (solo tramite link)</option>
              </select>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2">Categoria Prodotto</h3>
            <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full p-2 border rounded-lg outline-none bg-white text-sm">
              <option value="">Seleziona categoria...</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2">Immagine Prodotto</h3>
            {/* Show existing main image */}
            {product?.images && product.images.length > 0 && (
              <div className="relative rounded-xl overflow-hidden border aspect-square">
                <img
                  src={product.images.find((i: any) => i.isMain)?.url || product.images[0].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Principale
                </div>
              </div>
            )}
            {/* Upload button */}
            <label className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 transition-colors cursor-pointer ${
              isNew ? 'opacity-50 cursor-not-allowed' : 'hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50'
            }`}>
              {imageUploading ? (
                <Loader2 size={28} className="mb-2 animate-spin text-emerald-500" />
              ) : (
                <ImageIcon size={28} className="mb-2" />
              )}
              <span className="text-xs font-semibold">
                {isNew ? 'Salva prodotto prima di caricare' : imageUploading ? 'Caricamento...' : 'Clicca per aggiungere immagine'}
              </span>
              <span className="text-[10px] mt-1">JPG, PNG, WebP — max 10MB</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isNew || imageUploading}
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
