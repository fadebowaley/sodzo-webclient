import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Link as LinkIcon,
  Copy,
  Share2,
  ArrowLeft,
  Check,
  ExternalLink,
  Calendar,
  Eye,
} from 'lucide-react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { mockPaymentLinks } from '../../data/mockDonations';
import toast from 'react-hot-toast';

export default function PaymentLink() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    purpose: '',
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Replace with actual API call
    // POST /api/givings/payment-links
    const mockLink = `https://givings.sodzo.com/pay/${formData.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    setGeneratedLink(mockLink);
    toast.success('Payment link generated successfully!');
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (generatedLink && navigator.share) {
      try {
        await navigator.share({
          title: formData.title || 'Payment Link',
          text: formData.purpose || 'Please use this link to make a payment',
          url: generatedLink,
        });
        toast.success('Link shared!');
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      handleCopy();
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
            Generate Payment Link
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Create a custom payment link for donations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
              p-6
            `}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., January Tithe Collection"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Leave empty for custom amount"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  If left empty, donors can enter any amount
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purpose / Description *
                </label>
                <textarea
                  required
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Describe the purpose of this payment link..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Generate Payment Link
              </motion.button>
            </form>

            {/* Generated Link Display */}
            {generatedLink && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Generated Link
                  </h3>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShare}
                      className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                      <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopy}
                      className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </motion.button>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <p className="text-sm text-gray-900 dark:text-white flex-1 truncate">
                    {generatedLink}
                  </p>
                  <a
                    href={generatedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </a>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Share this link with donors to collect payments
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Previous Links */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`
              ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
              p-6
            `}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Previous Links
            </h2>
            <div className="space-y-4">
              {mockPaymentLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                      {link.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(link.status)}`}>
                      {link.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {link.purpose}
                  </p>
                  {link.amount && (
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      ₦{link.amount.toLocaleString()}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(link.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {link.usageCount} uses
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(link.link);
                        toast.success('Link copied!');
                      }}
                      className="flex-1 py-2 px-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-1">
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    <a
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </a>
                  </div>
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

