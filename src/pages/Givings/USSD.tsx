import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Copy,
  Check,
  ArrowLeft,
  Info,
  Calendar,
  Clock,
} from 'lucide-react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { mockUSSDCodes } from '../../data/mockDonations';
import toast from 'react-hot-toast';

export default function USSD() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();
  const [amount, setAmount] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateUSSDCode = (amountValue: number): string => {
    // TODO: Replace with actual USSD code generation from backend
    // This is a mock USSD code format
    const accountNumber = '0123456789'; // This should come from backend
    return `*737*1*${accountNumber}*${amountValue}#`;
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountValue = parseFloat(amount);
    const code = generateUSSDCode(amountValue);
    setGeneratedCode(code);
    toast.success('USSD code generated!');
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast.success('USSD code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'used':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const isExpired = (expiresAt: Date) => {
    return new Date() > expiresAt;
  };

  return (
    <div className="w-full space-y-6 mobile:space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/givings')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </motion.button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Generate USSD Code
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Create USSD codes for quick mobile banking transfers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form and Generated Code Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
              p-6
            `}>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (₦) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg font-semibold"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum amount: ₦1
                </p>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Generate USSD Code
              </motion.button>
            </form>
          </motion.div>

          {/* Generated Code Display */}
          {generatedCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`
                ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
                p-6
              `}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Generated USSD Code
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </motion.button>
              </div>

              <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Amount
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ₦{parseFloat(amount).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-center text-2xl font-mono font-bold text-gray-900 dark:text-white break-all">
                    {generatedCode}
                  </p>
                </div>
                <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-4">
                  Dial this code on your phone to complete the transfer
                </p>
              </div>
            </motion.div>
          )}

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`
              ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
              p-6
            `}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  How to Use USSD Code
                </h3>
                <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 font-bold flex-shrink-0">
                      1.
                    </span>
                    <span>
                      Copy the generated USSD code above
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 font-bold flex-shrink-0">
                      2.
                    </span>
                    <span>
                      Open your phone dialer
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 font-bold flex-shrink-0">
                      3.
                    </span>
                    <span>
                      Dial the code exactly as shown (e.g., *737*1*0123456789*5000#)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 font-bold flex-shrink-0">
                      4.
                    </span>
                    <span>
                      Follow the prompts on your screen to complete the transfer
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 font-bold flex-shrink-0">
                      5.
                    </span>
                    <span>
                      Save the transaction reference for your records
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Previous USSD Codes */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`
              ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
              p-6
            `}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Codes
            </h2>
            <div className="space-y-4">
              {mockUSSDCodes.map((code) => (
                <div
                  key={code.id}
                  className={`p-4 rounded-lg border ${
                    isExpired(code.expiresAt)
                      ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 opacity-60'
                      : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                  }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ₦{code.amount.toLocaleString()}
                      </p>
                      <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1 break-all">
                        {code.code}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(code.status)}`}>
                      {code.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(code.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Exp: {formatDate(code.expiresAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(code.code);
                      toast.success('Code copied!');
                    }}
                    className="w-full py-2 px-3 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors flex items-center justify-center gap-1">
                    <Copy className="w-3 h-3" />
                    Copy Code
                  </button>
                </div>
              ))}
            </div>
            {/* TODO: Add pagination when backend is integrated */}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

