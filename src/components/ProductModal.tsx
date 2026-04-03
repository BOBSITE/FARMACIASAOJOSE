import { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { Image as ImageIcon, FileText, Tag, Package, Info, Lock, Upload, X } from 'lucide-react';
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
  { value: 'Cosméticos e Beleza', label: 'Cosméticos e Beleza' },
  { value: 'Higiene Pessoal', label: 'Higiene Pessoal' },
  { value: 'Prod. Ortopédicos', label: 'Prod. Ortopédicos' },
  { value: 'Alimentos', label: 'Alimentos' },
  { value: 'Vida Saudável', label: 'Vida Saudável' },
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
    promoPrice: 0,
    costPrice: 0,
    stock: 0,
    minStock: 0,
    images: [],
    requiresPrescription: false,
    stripeType: 'None',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
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
      const newImages = await Promise.all(Array.from(files).map(processFile));
      
      setFormData(prev => {
        // Remove the placeholder image if it exists when adding real images
        const currentImages = prev.images?.filter(img => !img.includes('picsum.photos')) || [];
        return {
          ...prev,
          images: [...currentImages, ...newImages]
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
    setLoading(true);

    try {
      const path = 'products';
      // Ensure images array is not empty, add a placeholder if it is
      const rawDataToSave = {
        ...formData,
        images: formData.images && formData.images.length > 0 ? formData.images : ['https://picsum.photos/seed/product/400/400']
      };

      // Remove undefined values as Firestore doesn't support them
      const dataToSave = Object.fromEntries(
        Object.entries(rawDataToSave).filter(([_, v]) => v !== undefined)
      );

      if (product?.id) {
        await setDoc(doc(db, path, product.id), dataToSave, { merge: true });
      } else {
        await addDoc(collection(db, path), dataToSave);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erro ao salvar produto. Verifique os campos e tente novamente.');
      handleFirestoreError(error, OperationType.WRITE, 'products');
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
                    <div key={index} className="w-32 h-32 shrink-0 bg-gray-100 rounded-2xl overflow-hidden relative group">
                      <img src={img} alt={`Produto ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
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
                <p className="text-xs text-gray-500 mt-2 italic">Mínimo de 3 imagens recomendadas. Formatos aceitos: PNG, JPG. Clique no X vermelho para remover uma imagem.</p>
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
                        ['link', 'image'],
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
                        type="number" 
                        name="promoPrice"
                        step="0.01"
                        value={formData.promoPrice || ''}
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
                        type="number" 
                        name="price"
                        step="0.01"
                        required
                        value={formData.price || ''}
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
                        type="number" 
                        name="costPrice"
                        step="0.01"
                        value={formData.costPrice || ''}
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
