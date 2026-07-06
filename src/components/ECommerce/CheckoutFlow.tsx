import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowLeft, ArrowRight, CreditCard, User, ShoppingBag, Sparkles } from 'lucide-react';
import { CartItem } from './CartDrawer';
import GlassCard from './GlassCard';
import FloatingPanel from './FloatingPanel';

interface CheckoutFlowProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onComplete: () => void;
}

type CheckoutStep = 'cart' | 'customer' | 'payment' | 'success';

export default function CheckoutFlow({
  isOpen,
  onClose,
  items,
  onComplete,
}: CheckoutFlowProps) {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const shipping = items.some((item) => item.product.type === 'physical') ? 9.99 : 0;
  const total = subtotal + tax + shipping;

  const steps: { id: CheckoutStep; label: string; icon: typeof Check }[] = [
    { id: 'cart', label: 'Cart', icon: ShoppingBag },
    { id: 'customer', label: 'Customer Info', icon: User },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'success', label: 'Success', icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    if (currentStep === 'cart') {
      setCurrentStep('customer');
    } else if (currentStep === 'customer') {
      // Validate customer info
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.address) {
        alert('Please fill in all required fields');
        return;
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      // Validate payment info
      if (!formData.cardNumber || !formData.cardName || !formData.expiryDate || !formData.cvv) {
        alert('Please fill in all payment details');
        return;
      }
      setCurrentStep('success');
      // Simulate order completion
      setTimeout(() => {
        onComplete();
        handleClose();
      }, 3000);
    }
  };

  const handleBack = () => {
    if (currentStep === 'customer') {
      setCurrentStep('cart');
    } else if (currentStep === 'payment') {
      setCurrentStep('customer');
    }
  };

  const handleClose = () => {
    setCurrentStep('cart');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <FloatingPanel
      isOpen={isOpen}
      onClose={currentStep === 'success' ? undefined : handleClose}
      position="center"
      className="w-full max-w-4xl"
      showCloseButton={currentStep !== 'success'}
    >
      <div className="p-8">
        {/* Animated Step Indicators */}
        {currentStep !== 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 -z-10" />
              <motion.div
                className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 -z-10"
                initial={{ width: '0%' }}
                animate={{
                  width: `${(currentStepIndex / (steps.length - 2)) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />

              {/* Step Circles */}
              {steps.slice(0, 3).map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <div key={step.id} className="flex flex-col items-center relative z-10">
                    <motion.div
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-green-600 text-white shadow-sm'
                          : isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-400'
                      }`}
                      animate={{
                        scale: isActive ? [1, 1.1, 1] : 1,
                      }}
                      transition={{
                        duration: 2,
                        repeat: isActive ? Infinity : 0,
                      }}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          <Check className="w-8 h-8" />
                        </motion.div>
                      ) : (
                        <StepIcon className="w-8 h-8" />
                      )}
                    </motion.div>
                    <motion.span
                      className={`mt-2 text-sm font-semibold ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                      }}
                    >
                      {step.label}
                    </motion.span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Cart Summary */}
            {currentStep === 'cart' && (
              <motion.div
                key="cart"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Order Summary
                </h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <GlassCard key={item.product.id} glowColor="blue" intensity="low" className="p-4">
                      <div className="flex gap-4">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-xl"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                            {item.product.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
                <GlassCard glowColor="purple" intensity="medium" className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-base text-gray-700 dark:text-gray-300">
                      <span>Subtotal</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    {shipping > 0 && (
                      <div className="flex justify-between text-base text-gray-700 dark:text-gray-300">
                        <span>Shipping</span>
                        <span className="font-semibold">${shipping.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base text-gray-700 dark:text-gray-300">
                      <span>Tax</span>
                      <span className="font-semibold">${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">Total</span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Step 2: Customer Information */}
            {currentStep === 'customer' && (
              <motion.div
                key="customer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Customer Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'First Name *', key: 'firstName', type: 'text' },
                    { label: 'Last Name *', key: 'lastName', type: 'text' },
                    { label: 'Email *', key: 'email', type: 'email' },
                    { label: 'Phone', key: 'phone', type: 'tel' },
                    { label: 'Address *', key: 'address', type: 'text', fullWidth: true },
                    { label: 'City', key: 'city', type: 'text' },
                    { label: 'State', key: 'state', type: 'text' },
                    { label: 'ZIP Code', key: 'zipCode', type: 'text' },
                  ].map((field) => (
                    <motion.div
                      key={field.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className={field.fullWidth ? 'md:col-span-2' : ''}
                    >
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        value={formData[field.key as keyof typeof formData]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.key]: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                        required={field.label.includes('*')}
                      />
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-2"
                  >
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="NG">Nigeria</option>
                    </select>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment Preview */}
            {currentStep === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Payment Information
                </h2>
                <div className="space-y-4">
                  {[
                    { label: 'Card Number *', key: 'cardNumber', placeholder: '1234 5678 9012 3456', maxLength: 16 },
                    { label: 'Cardholder Name *', key: 'cardName', placeholder: 'John Doe' },
                    { label: 'Expiry Date *', key: 'expiryDate', placeholder: 'MM/YY', maxLength: 5 },
                    { label: 'CVV *', key: 'cvv', placeholder: '123', maxLength: 3 },
                  ].map((field) => (
                    <motion.div
                      key={field.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className={field.key === 'expiryDate' || field.key === 'cvv' ? 'md:w-1/2 inline-block md:mr-4' : ''}
                    >
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={formData[field.key as keyof typeof formData]}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (field.key === 'cardNumber') {
                            value = value.replace(/\D/g, '').slice(0, 16);
                          } else if (field.key === 'expiryDate') {
                            value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
                          } else if (field.key === 'cvv') {
                            value = value.replace(/\D/g, '').slice(0, 3);
                          }
                          setFormData({ ...formData, [field.key]: value });
                        }}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                        required
                      />
                    </motion.div>
                  ))}
                  <GlassCard glowColor="blue" intensity="low" className="p-4 mt-6">
                    <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <strong>Note:</strong> This is a demo checkout. No actual payment will be processed.
                    </p>
                  </GlassCard>
                </div>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {currentStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/50"
                >
                  <Check className="w-12 h-12 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
                >
                  Order Placed Successfully!
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-gray-600 dark:text-gray-400 mb-2"
                >
                  Thank you for your purchase. You will receive a confirmation email shortly.
                </motion.p>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-gray-500 dark:text-gray-500"
                >
                  Redirecting...
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        {currentStep !== 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <motion.button
              onClick={currentStep === 'cart' ? handleClose : handleBack}
              className="flex items-center gap-2 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              {currentStep === 'cart' ? 'Cancel' : 'Back'}
            </motion.button>
            <motion.button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {currentStep === 'payment' ? 'Place Order' : 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </FloatingPanel>
  );
}
