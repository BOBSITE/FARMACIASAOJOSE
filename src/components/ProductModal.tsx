import { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { Image as ImageIcon, FileText, Tag, Package, Info, Lock, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'Medicamentos', label: 'Medicamentos' },
  { value: 'Higiene Pessoal', label: 'Higiene Pessoal' },
  { value: 'Cosméticos e Beleza', label: 'Cosméticos e Beleza' },
  { value: 'Mamãe & Bebê', label: 'Mamãe & Bebê' },
  { value: 'Suplementos', label: 'Suplementos' },
  { value: 'Ortopédicos', label: 'Ortopédicos' },
  { value: 'Alimentos', label: 'Alimentos' },
];

const SUBCATEGORY_OPTIONS = [
  { value: 'Analgésicos', label: 'Analgésicos' },
  { value: 'Anti-inflamatórios', label: 'Anti-inflamatórios' },
  { value: 'Skincare', label: 'Skincare' },
  { value: 'Banho', label: 'Banho' },
  { value: 'Equipamentos', label: 'Equipamentos' },
];

const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: '#F4F9F4',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.2rem',
    boxShadow: state.isFocused ? '0 0 0 2px #2E7D32' : 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#2E7D32' : state.isFocused ? '#E8F5E9' : 'white',
    color: state.isSelected ? 'white' : '#111827',
    fontSize: '0.875rem',
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: '0.75rem',
    overflow: 'hidden',
    zIndex: 50,
  }),
};

const compressImage = (base64: string, maxWidth = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

const sanitizeDescription = (html: string) => {
  // Remove data:image base64 sources that might be pasted into Quill
  return html.replace(/<img[^>]*src="data:image\/[^">]+"[^>]*>/g, '<p><em>[Imagem removida para economizar espaço]</em></p>');
};

export default function ProductModal({ isOpen, onClose, product, onSuccess }: ProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    ean: '',
    sku: '',
    manufacturer: '',
    category: '',
    subcategory: '',
    badge: '',
    price: 0,
    costPrice: 0,
    isWeeklyOffer: false,
    stock: 0,
    minStock: 0,
    images: [],
    requiresPrescription: false,
    stripeType: 'None',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const moveImage = (index: number, direction: 'left' | 'right') => {
    setFormData(prev => {
      if (!prev.images) return prev;
      const newImages = [...prev.images];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      
      if (targetIndex < 0 || targetIndex >= newImages.length) return prev;
      
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      
      return { ...prev, images: newImages };
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    
    setFormData(prev => {
      if (!prev.images) return prev;
      const newImages = [...prev.images];
      const draggedItem = newImages[draggedIndex];
      newImages.splice(draggedIndex, 1);
      newImages.splice(index, 0, draggedItem);
      return { ...prev, images: newImages };
    });
    setDraggedIndex(null);
  };

  const addVariationGroup = () => {
    setFormData(prev => ({
      ...prev,
      variations: [
        ...(prev.variations || []),
        { name: '', options: [] }
      ]
    }));
  };

  const removeVariationGroup = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations?.filter((_, i) => i !== index)
    }));
  };

  const updateVariationGroupName = (index: number, name: string) => {
    setFormData(prev => {
      const newVariations = [...(prev.variations || [])];
      newVariations[index] = { ...newVariations[index], name };
      return { ...prev, variations: newVariations };
    });
  };

  const addVariationOption = (groupIndex: number) => {
    setFormData(prev => {
      const newVariations = [...(prev.variations || [])];
      newVariations[groupIndex] = {
        ...newVariations[groupIndex],
        options: [...newVariations[groupIndex].options, { name: '', stock: 0 }]
      };
      return { ...prev, variations: newVariations };
    });
  };

  const removeVariationOption = (groupIndex: number, optionIndex: number) => {
    setFormData(prev => {
      const newVariations = [...(prev.variations || [])];
      newVariations[groupIndex] = {
        ...newVariations[groupIndex],
        options: newVariations[groupIndex].options.filter((_, i) => i !== optionIndex)
      };
      return { ...prev, variations: newVariations };
    });
  };

  const updateVariationOption = (groupIndex: number, optionIndex: number, field: 'name' | 'stock', value: string | number) => {
    setFormData(prev => {
      const newVariations = [...(prev.variations || [])];
      const newOptions = [...newVariations[groupIndex].options];
      newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
      newVariations[groupIndex] = { ...newVariations[groupIndex], options: newOptions };
      return { ...prev, variations: newVariations };
    });
  };

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        isWeeklyOffer: product.isWeeklyOffer || false,
        description: product.description || '',
      });
    } else {
      setFormData({
        name: '',
        ean: '',
        sku: '',
        manufacturer: '',
        category: '',
        subcategory: '',
        badge: '',
        price: 0,
        promoPrice: 0,
        costPrice: 0,
        isWeeklyOffer: false,
        stock: 0,
        minStock: 0,
        images: [],
        requiresPrescription: false,
        stripeType: 'None',
        description: '',
      });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const formatBRL = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (['price', 'promoPrice', 'costPrice'].includes(name)) {
      // Mascara de moeda brasileira (centavos)
      const digits = value.replace(/\D/g, '');
      const amount = Number(digits) / 100;
      setFormData(prev => ({ ...prev, [name]: amount }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const processFile = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const rawImages = await Promise.all(Array.from(files).map(processFile));
      // Compress each image before adding to state
      const compressedImages = await Promise.all(rawImages.map(img => compressImage(img)));
      
      setFormData(prev => {
        // Remove the placeholder image if it exists when adding real images
        const currentImages = prev.images?.filter(img => !img.includes('picsum.photos')) || [];
        return {
          ...prev,
          images: [...currentImages, ...compressedImages]
        };
      });
    } catch (error) {
      console.error('Error reading images:', error);
      alert('Erro ao carregar a imagem. Tente novamente.');
    } finally {
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, index) => index !== indexToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setLoading(true);

    try {
      // 1. Sanitize Quill description
      const finalDescription = sanitizeDescription(formData.description || '');
      
      // 2. Strict Pre-Validation
      if (!formData.name || formData.name.trim().length === 0) throw new Error('O nome do produto é obrigatório.');
      if (formData.name.length >= 200) throw new Error('O nome do produto é muito longo (máximo 200 caracteres).');
      if (!formData.category) throw new Error('A categoria é obrigatória.');
      if ((formData.price || 0) <= 0) throw new Error('O preço de venda deve ser maior que zero.');
      if ((formData.stock || 0) < 0) throw new Error('O estoque não pode ser negativo.');

      // 3. Prepare data in snake_case for Supabase
      const dataToSave: any = {
        name: formData.name,
        ean: formData.ean || '',
        sku: formData.sku || null,
        manufacturer: formData.manufacturer || '',
        category: formData.category,
        subcategory: formData.subcategory || null,
        badge: formData.badge || null,
        price: formData.price || 0,
        promo_price: formData.promoPrice || null,
        cost_price: formData.costPrice || null,
        stock: formData.stock || 0,
        min_stock: formData.minStock || 0,
        images: formData.images && formData.images.length > 0 ? formData.images : ['https://picsum.photos/seed/product/400/400'],
        requires_prescription: formData.requiresPrescription || false,
        stripe_type: formData.stripeType || 'None',
        is_weekly_offer: formData.isWeeklyOffer || false,
        description: finalDescription,
        variations: formData.variations || [],
        updated_at: new Date().toISOString()
      };

      // 4. Payload size audit
      const totalSize = JSON.stringify(dataToSave).length;
      const descSize = (dataToSave.description || '').length;
      const imgsSize = JSON.stringify(dataToSave.images || []).length;
      console.log(`Payload Audit: Total=${(totalSize/1024).toFixed(1)}KB, Desc=${(descSize/1024).toFixed(1)}KB, Imgs=${(imgsSize/1024).toFixed(1)}KB`);

      if (totalSize > 980000) {
        throw new Error('O produto está muito grande (muitas imagens ou descrição longa). Reduza o conteúdo e tente novamente.');
      }

      // 5. Save to Supabase
      if (product?.id) {
        const { error } = await supabase
          .from('products')
          .update(dataToSave)
          .eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(dataToSave);
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Save Failure:', error);
      
      let msg = error.message || 'Erro inesperado ao salvar.';
      if (error.code === '42501') {
        msg = 'Erro de permissão: Sua conta não tem autorização para editar produtos.';
      }
        
      setSaveError(msg);
      handleSupabaseError(error, 'WRITE', 'products');
    } finally {
      setLoading(false);
    }
  };

  // Calculate profit margin
  const profitMargin = formData.price && formData.costPrice 
    ? (((formData.price - formData.costPrice) / formData.price) * 100).toFixed(0) 
    : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-[#F4F9F4] w-full h-full md:w-[95vw] md:h-[95vh] md:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          <form id="product-form" onSubmit={handleSubmit} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Fotos do Produto */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-6">
                  <ImageIcon className="w-5 h-5 text-[#2E7D32]" />
                  <h3 className="text-lg font-black text-gray-900">Fotos do Produto</h3>
                </div>
                <div className="flex space-x-4 overflow-x-auto pb-4">
                  {/* Hidden File Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/png, image/jpeg, image/webp" 
                    multiple 
                    className="hidden" 
                  />
                  
                  {/* Add Photo Button */}
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 shrink-0 bg-[#F4F9F4] rounded-2xl border-2 border-dashed border-[#2E7D32]/30 flex flex-col items-center justify-center text-[#2E7D32] hover:bg-[#E8F5E9] transition-colors"
                  >
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-wider">Adicionar</span>
                  </button>
                  
                  {/* Existing Photos */}
                  {formData.images?.map((img, index) => (
                    <div 
                      key={img + index} 
                      draggable 
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      className={`w-32 h-32 shrink-0 rounded-2xl overflow-hidden relative group cursor-move transition-all ${
                        draggedIndex === index ? 'opacity-30 scale-95 border-2 border-dashed border-[#2E7D32]' : 'bg-gray-100'
                      }`}
                    >
                      <img src={img} alt={`Produto ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      
                      {/* Movement Controls */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-2">
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'left')}
                          className={`bg-white/90 text-[#2E7D32] p-1 rounded-lg hover:bg-white transition-colors ${index === 0 ? 'invisible' : ''}`}
                          title="Mover para esquerda"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors mx-1"
                          title="Remover imagem"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveImage(index, 'right')}
                          className={`bg-white/90 text-[#2E7D32] p-1 rounded-lg hover:bg-white transition-colors ${index === (formData.images?.length || 0) - 1 ? 'invisible' : ''}`}
                          title="Mover para direita"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Photo Label (Main) */}
                      {index === 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-[#2E7D32] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg">
                          Principal
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Placeholders if less than 3 images */}
                  {(!formData.images || formData.images.length < 1) && (
                    <div className="w-32 h-32 shrink-0 bg-[#F4F9F4] rounded-2xl flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  {(!formData.images || formData.images.length < 2) && (
                    <div className="w-32 h-32 shrink-0 bg-[#F4F9F4] rounded-2xl flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">Dica: Arraste as fotos ou use as setas para reordenar. A primeira foto será a principal.</p>
              </div>

              {/* Informações Básicas */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-6">
                  <FileText className="w-5 h-5 text-[#2E7D32]" />
                  <h3 className="text-lg font-black text-gray-900">Informações Básicas</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Nome do Produto</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ex: Amoxicilina 500mg"
                      className="w-full bg-[#F4F9F4] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2E7D32] text-gray-900 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Marca / Laboratório</label>
                      <input 
                        type="text" 
                        name="manufacturer"
                        required
                        value={formData.manufacturer}
                        onChange={handleChange}
                        placeholder="Ex: Eurofarma"
                        className="w-full bg-[#F4F9F4] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2E7D32] text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">SKU</label>
                      <input 
                        type="text" 
                        name="sku"
                        value={formData.sku || ''}
                        onChange={handleChange}
                        placeholder="REF-00002"
                        className="w-full bg-[#F4F9F4] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2E7D32] text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Categoria</label>
                      <CreatableSelect
                        isClearable
                        options={CATEGORY_OPTIONS}
                        value={formData.category ? { value: formData.category, label: formData.category } : null}
                        onChange={(newValue: any) => setFormData(prev => ({ ...prev, category: newValue ? newValue.value : '' }))}
                        placeholder="Selecione ou digite..."
                        styles={customSelectStyles}
                        formatCreateLabel={(inputValue) => `Criar "${inputValue}"`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Subcategoria</label>
                      <CreatableSelect
                        isClearable
                        options={SUBCATEGORY_OPTIONS}
                        value={formData.subcategory ? { value: formData.subcategory, label: formData.subcategory } : null}
                        onChange={(newValue: any) => setFormData(prev => ({ ...prev, subcategory: newValue ? newValue.value : '' }))}
                        placeholder="Selecione ou digite..."
                        styles={customSelectStyles}
                        formatCreateLabel={(inputValue) => `Criar "${inputValue}"`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Selo Especial (Badge)</label>
                      <select 
                        name="badge"
                        value={formData.badge || ''}
                        onChange={handleChange}
                        className="w-full bg-[#F4F9F4] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2E7D32] text-gray-900 font-medium appearance-none"
                      >
                        <option value="">Nenhum</option>
                        <option value="Mais Vendido">Mais Vendido</option>
                        <option value="Lançamento">Lançamento</option>
                        <option value="Oferta">Oferta</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Oferta da Semana?</label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, isWeeklyOffer: !prev.isWeeklyOffer }))}
                        className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-black transition-all border-2 ${
                          formData.isWeeklyOffer 
                            ? 'bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]' 
                            : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        <Tag className={`w-4 h-4 ${formData.isWeeklyOffer ? 'fill-current' : ''}`} />
                        <span>{formData.isWeeklyOffer ? 'ATIVA NA HOME' : 'NÃO ATIVA'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrição & Bula */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-6">
                  <FileText className="w-5 h-5 text-[#2E7D32]" />
                  <h3 className="text-lg font-black text-gray-900">Descrição & Bula</h3>
                </div>
                <div className="bg-[#F4F9F4] rounded-xl overflow-hidden border-none">
                  <style>
                    {`
                      .ql-toolbar.ql-snow {
                        border: none !important;
                        border-bottom: 1px solid #E5E7EB !important;
                        background-color: #F4F9F4;
                        font-family: inherit;
                        padding: 12px;
                      }
                      .ql-container.ql-snow {
                        border: none !important;
                        background-color: #F4F9F4;
                        font-family: inherit;
                        font-size: 0.875rem;
                      }
                      .ql-editor {
                        min-height: 150px;
                        padding: 16px;
                      }
                      .ql-editor:focus {
                        outline: 2px solid #2E7D32;
                        border-radius: 0 0 0.75rem 0.75rem;
                      }
                      .ql-editor p {
                        margin-bottom: 0.5rem;
                      }
                    `}
                  </style>
                  <ReactQuill 
                    theme="snow"
                    value={formData.description}
                    onChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
                    placeholder="Insira aqui os detalhes do produto, indicações, contraindicações e modo de uso..."
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                      ],
                    }}
                  />
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Preços */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-6">
                  <Tag className="w-5 h-5 text-[#2E7D32]" />
                  <h3 className="text-lg font-black text-gray-900">Preços</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Preço Riscado</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">R$</span>
                      <input 
                        type="text" 
                        name="promoPrice"
                        value={formatBRL(formData.promoPrice)}
                        onChange={handleChange}
                        placeholder="0,00"
                        className="w-full bg-[#F4F9F4] border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#2E7D32] text-gray-900 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Preço de Venda</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">R$</span>
                      <input 
                        type="text" 
                        name="price"
                        required
                        value={formatBRL(formData.price)}
                        onChange={handleChange}
                        placeholder="0,00"
                        className="w-full bg-[#F4F9F4] border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#2E7D32] text-gray-900 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Preço de Custo</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">R$</span>
                      <input 
                        type="text" 
                        name="costPrice"
                        value={formatBRL(formData.costPrice)}
                        onChange={handleChange}
                        placeholder="0,00"
                        className="w-full bg-[#F4F9F4] border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#2E7D32] text-gray-900 font-medium"
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Margem de Lucro:</span>
                    <span className="text-sm font-black text-gray-900">{profitMargin}%</span>
                  </div>
                </div>
              </div>

              {/* Estoque */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-6">
                  <Package className="w-5 h-5 text-[#2E7D32]" />
                  <h3 className="text-lg font-black text-gray-900">Estoque</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Estoque Inicial</label>
                    <input 
                      type="number" 
                      name="stock"
                      required
                      value={formData.stock || ''}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full bg-[#F4F9F4] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2E7D32] text-gray-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Estoque Mínimo (Alerta)</label>
                    <input 
                      type="number" 
                      name="minStock"
                      value={formData.minStock || ''}
                      onChange={handleChange}
                      placeholder="5"
                      className="w-full bg-[#F4F9F4] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2E7D32] text-gray-900 font-medium"
                    />
                  </div>
                  <div className="bg-[#E8F5E9] p-4 rounded-xl flex items-start space-x-3">
                    <Info className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#2E7D32] font-medium leading-relaxed">
                      O sistema enviará uma notificação quando o estoque atingir o limite mínimo.
                    </p>
                  </div>
                </div>
              </div>


              {/* Variações */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-[#2E7D32]" />
                    <h3 className="text-lg font-black text-gray-900">Variações</h3>
                  </div>
                  <button 
                    type="button" 
                    onClick={addVariationGroup}
                    className="text-[10px] font-black uppercase tracking-widest text-[#2E7D32] hover:bg-[#E8F5E9] px-3 py-1.5 rounded-lg transition-all border border-[#2E7D32]/20"
                  >
                    + Novo Grupo (ex: Sabor)
                  </button>
                </div>
                
                <div className="space-y-6">
                  {formData.variations?.map((group, gIndex) => (
                    <div key={gIndex} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-grow">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nome do Grupo</label>
                          <input 
                            type="text" 
                            value={group.name}
                            onChange={(e) => updateVariationGroupName(gIndex, e.target.value)}
                            placeholder="Ex: Sabor, Tamanho, Cor"
                            className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#2E7D32]"
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeVariationGroup(gIndex)}
                          className="mt-6 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Opções e Estoque</label>
                          <button 
                            type="button" 
                            onClick={() => addVariationOption(gIndex)}
                            className="text-[9px] font-black uppercase tracking-tighter text-[#2E7D32] hover:underline"
                          >
                            + Adicionar Opção
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {group.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <input 
                                type="text" 
                                value={option.name}
                                onChange={(e) => updateVariationOption(gIndex, oIndex, 'name', e.target.value)}
                                placeholder="Nome (Ex: Morango)"
                                className="flex-grow bg-white border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-[#2E7D32]"
                              />
                              <div className="relative w-24">
                                <input 
                                  type="number" 
                                  value={option.stock}
                                  onChange={(e) => updateVariationOption(gIndex, oIndex, 'stock', parseInt(e.target.value) || 0)}
                                  className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-[#2E7D32] text-right pr-7"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300 uppercase">UN</span>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => removeVariationOption(gIndex, oIndex)}
                                className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!formData.variations || formData.variations.length === 0) && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
                      <p className="text-xs text-gray-400 font-medium">Nenhuma variação cadastrada para este produto.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Necessita Receita? */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900">Necessita Receita?</h3>
                  <p className="text-xs text-gray-500 mt-1">Exigir prescrição médica</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="requiresPrescription"
                    checked={formData.requiresPrescription}
                    onChange={handleChange}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32]"></div>
                </label>
              </div>

            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 md:px-8 flex flex-col sm:flex-row justify-between items-center z-10">
          <div className="flex items-center text-xs text-gray-500 font-medium mb-4 sm:mb-0">
            <FileText className="w-4 h-4 mr-2" />
            Alterações salvas automaticamente como rascunho.
          </div>
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            {saveError && (
              <div className="flex-1 sm:flex-none text-red-600 text-xs font-bold bg-red-50 px-4 py-2 rounded-lg animate-pulse">
                ⚠️ {saveError}
              </div>
            )}
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-3 font-bold text-gray-900 hover:bg-gray-100 rounded-xl transition-colors text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              form="product-form"
              disabled={loading}
              className="flex-1 sm:flex-none px-8 py-3 font-bold text-white bg-[#1B5E20] hover:bg-[#144317] rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
