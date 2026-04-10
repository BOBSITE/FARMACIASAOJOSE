import { motion } from 'motion/react';
import { ShoppingBag, CheckCircle, Package, Truck, Home } from 'lucide-react';
import { Order } from '../types';

interface OrderTrackerProps {
  status: Order['status'];
}

const statusSteps = [
  { id: 'PENDING', label: 'Recebido', icon: ShoppingBag },
  { id: 'APPROVED', label: 'Preparando', icon: Package },
  { id: 'SHIPPED', label: 'A caminho', icon: Truck },
  { id: 'DELIVERED', label: 'Entregue', icon: Home },
];

export default function OrderTracker({ status }: OrderTrackerProps) {
  if (status === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center space-x-3">
        <div className="p-2 bg-red-100 rounded-full">
          <CheckCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="text-red-900 font-bold text-sm">Pedido Cancelado</p>
          <p className="text-red-700 text-xs text-opacity-80">Este pedido não pôde ser processado.</p>
        </div>
      </div>
    );
  }

  const currentStep = statusSteps.findIndex((step) => step.id === status);
  const progressPercent = (currentStep / (statusSteps.length - 1)) * 100;

  return (
    <div className="py-6 px-2">
      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full" />
        
        {/* Progress Line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-5 left-0 h-1 bg-[#0047BA] rounded-full z-10"
        />

        {/* Steps */}
        <div className="relative flex justify-between items-start z-20">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStep;
            const IsActive = index === currentStep;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center group">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted ? '#0047BA' : '#FFFFFF',
                    scale: IsActive ? 1.2 : 1,
                    borderColor: isCompleted ? '#0047BA' : '#E5E7EB'
                  }}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm ${
                    IsActive ? 'shadow-blue-200 ring-4 ring-blue-50' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-gray-300'}`} />
                </motion.div>
                
                <div className="mt-3 text-center">
                  <p className={`text-[10px] font-bold uppercase tracking-tight ${
                    isCompleted ? 'text-[#002699]' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {IsActive && (
                    <motion.div 
                      layoutId="active-dot"
                      className="w-1 h-1 bg-[#0047BA] rounded-full mx-auto mt-1"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
