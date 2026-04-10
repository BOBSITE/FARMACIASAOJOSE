import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadCloud, AlertTriangle, Check } from 'lucide-react';
import { useAuthStore } from '../lib/store';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PrescriptionModal({ isOpen, onClose, onConfirm }: PrescriptionModalProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState<'me' | 'other'>('me');
  const [otherName, setOtherName] = useState('');
  const [otherCpf, setOtherCpf] = useState('');
  const [digitalLink, setDigitalLink] = useState('');
  const [hasFile, setHasFile] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => setStep((s) => Math.min(2, s + 1));
  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const Stepper = ({ current }: { current: number }) => (
    <div className="flex items-center justify-center mb-8 px-8">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${current === 1 ? 'bg-[#E3F2FD] text-[#0088CC]' : current > 1 ? 'bg-[#C8E6C9] text-[#388E3C]' : 'bg-[#F5F5F5] text-gray-400'}`}>
        {current > 1 ? <Check className="w-5 h-5 fill-current"/> : '1'}
      </div>
      <div className="flex-1 h-px bg-gray-200 mx-4 relative">
        <div className={`absolute top-0 left-0 h-full bg-[#0088CC] transition-all`} style={{ width: current > 1 ? '100%' : '0%' }} />
      </div>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${current === 2 ? 'bg-[#E3F2FD] text-[#0088CC]' : 'bg-[#F5F5F5] text-gray-400'}`}>
        2
      </div>
      <div className="flex-1 h-px bg-[#0088CC] opacity-20 mx-4" />
      <div className={`w-8 h-8 rounded-full bg-[#E3F2FD] opacity-50 flex items-center justify-center text-xs font-bold text-gray-400`}></div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
             <div className="w-6"></div>
             <h2 className="text-lg font-bold text-gray-800 text-center flex-1">Envio de receita</h2>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
               <X className="w-6 h-6" />
             </button>
          </div>

          {step === 0 && (
            <div className="space-y-6 text-sm text-gray-600">
              <p>
                <strong>1. É recomendado o envio da receita digital e/ou entrega da receita física original.</strong> Para uma experiência completa, envie sua receita para validação.
              </p>
              <p>
                <strong>2. Prazo de processamento: A análise da receita será feita em até 60 minutos, após a confirmação do pagamento.</strong>
              </p>
              <p>
                <strong>3. Receita: O anexo da foto não substitui a entrega e retenção da receita original, mas auxilia a antecipação da validação que ocorrerá por um de nossos farmacêuticos.</strong>
              </p>

              <div className="mt-8 space-y-4">
                <button onClick={handleNext} className="w-full bg-[#0088CC] hover:bg-[#0077B3] text-white font-bold py-3 px-4 rounded-full transition-colors uppercase tracking-tight">
                  Enviar Receita
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <Stepper current={1} />
              
              <p className="text-sm text-gray-600 mb-6">
                Selecione se a receita está em seu nome ou se você está comprando para outra pessoa.
              </p>

              <div className="space-y-4">
                <label className={`block border rounded-lg p-4 cursor-pointer transition-colors ${recipient === 'me' ? 'border-[#0088CC] bg-[#F5FBFF]' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-bold ${recipient === 'me' ? 'text-[#0088CC]' : 'text-gray-700'}`}>{user?.displayName || 'Você'}</p>
                      {user?.cpf && <p className={`text-sm ${recipient === 'me' ? 'text-[#0088CC]' : 'text-gray-500'}`}>CPF: {user.cpf}</p>}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${recipient === 'me' ? 'border-[#0088CC]' : 'border-gray-300'}`}>
                      {recipient === 'me' && <div className="w-2.5 h-2.5 rounded-full bg-[#0088CC]" />}
                    </div>
                  </div>
                  <input type="radio" className="hidden" checked={recipient === 'me'} onChange={() => setRecipient('me')} />
                </label>

                <div>
                   <label className="flex items-start space-x-2 text-sm text-gray-600 mb-2 font-medium cursor-pointer">
                     <input type="radio" className="mt-1" checked={recipient === 'other'} onChange={() => setRecipient('other')} />
                     <span>Caso a receita não seja para você, informe os dados da pessoa para quem está realizando a compra.</span>
                   </label>
                </div>

                {recipient === 'other' && (
                  <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-tight">Nome e Sobrenome</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Lineu Silva"
                        value={otherName}
                        onChange={(e) => setOtherName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium outline-none focus:border-[#0088CC]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-tight">CPF</label>
                      <input 
                        type="text" 
                        placeholder="Somente números"
                        value={otherCpf}
                        onChange={(e) => setOtherCpf(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium outline-none focus:border-[#0088CC]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col space-y-3">
                <button 
                  onClick={handleNext} 
                  disabled={recipient === 'other' && (!otherName || !otherCpf)}
                  className="w-full bg-[#0088CC] hover:bg-[#0077B3] disabled:bg-[#E0E0E0] text-white font-bold py-3 px-4 rounded-full transition-colors uppercase tracking-tight"
                >
                  Próximo
                </button>
                <button onClick={handleBack} className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 font-bold py-3 px-4 rounded-full transition-colors uppercase tracking-tight">
                  Voltar
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <Stepper current={2} />
              
              <p className="text-sm text-gray-600 mb-6 text-center">
                Siga as orientações para envio da sua receita ou insira o link do formato digital.
              </p>

              <div className="flex justify-center mb-6">
                 <div className="w-12 h-14 bg-white border-2 border-[#1A237E] rounded-lg flex flex-col items-center justify-center relative shadow-sm">
                    <span className="text-[#D32F2F] font-bold text-xl leading-none -mt-1">+</span>
                    <div className="w-6 h-[2px] bg-[#1A237E] mt-1" />
                    <div className="w-4 h-[2px] bg-[#1A237E] mt-1" />
                 </div>
              </div>

              <div className="text-xs text-gray-600 space-y-1 mb-6 px-2">
                <p>1. Faça uma <strong>foto</strong> ou salve sua receita em um <strong>arquivo</strong> .pdf;</p>
                <p>2. O tamanho da foto ou arquivo <strong>não</strong> pode ser maior a <strong>4Mb</strong>;</p>
                <p>3. Certifique-se de que os dados da receita são <strong>legíveis</strong>.</p>
              </div>

              <div className="mb-6">
                <input
                  type="file"
                  id="prescription-upload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setHasFile(true);
                      // Opcionalmente podemos guardar o nome do arquivo se quiser mostrar:
                      // setFileName(e.target.files[0].name);
                    }
                  }}
                  accept="image/*,.pdf"
                />
                <label 
                  htmlFor="prescription-upload"
                  className={`w-full border border-gray-300 border-dashed rounded-lg py-3 flex items-center justify-center space-x-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer ${hasFile ? 'bg-green-50 border-green-300 text-green-700' : ''}`}
                >
                  <span>{hasFile ? 'Receita anexada (1)' : 'Enviar receita'}</span>
                  {hasFile ? <Check className="w-5 h-5 text-green-600" /> : <UploadCloud className="w-5 h-5" />}
                </label>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-600 mb-1">Link da receita digital</label>
                <input 
                  type="text" 
                  placeholder="Insira o link da sua receita digital"
                  value={digitalLink}
                  onChange={(e) => setDigitalLink(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium outline-none focus:border-[#0088CC]"
                />
              </div>

              <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-lg p-4 flex items-start space-x-3 mb-6">
                <AlertTriangle className="w-5 h-5 text-[#F57F17] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-800 mb-1">Item com retenção de receita</p>
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    É obrigatório o envio da receita digital e/ou a entrega da receita física original. Sem a receita, o pedido não poderá ser entregue.
                  </p>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                {(!hasFile && !digitalLink.trim()) ? (
                  <button disabled className="w-full bg-[#E0E0E0] text-gray-500 font-bold py-3 px-4 rounded-full transition-colors uppercase tracking-tight">
                    Próximo
                  </button>
                ) : (
                  <button onClick={() => { onConfirm(); onClose(); }} className="w-full bg-[#0088CC] hover:bg-[#0077B3] text-white font-bold py-3 px-4 rounded-full transition-colors flex items-center justify-center uppercase tracking-tight shadow-md">
                    Adicionar ao Carrinho
                  </button>
                )}
                <button onClick={handleBack} className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 font-bold py-3 px-4 rounded-full transition-colors uppercase tracking-tight">
                  Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
