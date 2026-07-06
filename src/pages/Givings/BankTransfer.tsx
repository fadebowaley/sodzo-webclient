import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Copy,
  Check,
  ArrowLeft,
  CheckCircle,
  Banknote,
} from 'lucide-react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { bankAccounts } from '../../data/mockDonations';
import toast from 'react-hot-toast';

export default function BankTransfer() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const handleCopyAccount = (accountNumber: string, accountId: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedAccount(accountId);
    toast.success('Account number copied to clipboard!');
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleCopyFullDetails = (account: typeof bankAccounts[0]) => {
    const details = `Bank: ${account.bankName}\nAccount Name: ${account.accountName}\nAccount Number: ${account.accountNumber}${account.bankCode ? `\nBank Code: ${account.bankCode}` : ''}`;
    navigator.clipboard.writeText(details);
    toast.success('Account details copied!');
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
            Bank Transfer
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            View church bank account details for direct transfers
          </p>
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bankAccounts.map((account, index) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={!isMobile ? { y: -5, scale: 1.02 } : {}}
            className={`
              ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
              p-6 relative overflow-hidden
            `}>
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-full -mr-16 -mt-16" />

            <div className="relative z-10">
              {/* Bank Logo and Name */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-2xl">
                  {account.logo || '🏦'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {account.bankName}
                  </h3>
                  {account.bankCode && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Code: {account.bankCode}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Account Name
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {account.accountName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Account Number
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                      {account.accountNumber}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleCopyAccount(account.accountNumber, account.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      {copiedAccount === account.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCopyFullDetails(account)}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
                  <Copy className="w-4 h-4" />
                  Copy All Details
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Instructions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`
          ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
          p-6
        `}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Banknote className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Transfer Instructions
            </h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">
                  1.
                </span>
                <span>
                  Copy the account number using the copy button above
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">
                  2.
                </span>
                <span>
                  Open your banking app or visit your bank
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">
                  3.
                </span>
                <span>
                  Initiate a transfer to the account number
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">
                  4.
                </span>
                <span>
                  Use your name and purpose as the transfer reference
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">
                  5.
                </span>
                <span>
                  After transfer, send proof of payment for confirmation
                </span>
              </li>
            </ol>
          </div>
        </div>
      </motion.div>

      {/* Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
              Important Note
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-400">
              All transfers are processed automatically. Please ensure you use the correct account
              number and include your name in the transfer reference for easy identification.
              {/* TODO: Add backend endpoint for transfer verification */}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

