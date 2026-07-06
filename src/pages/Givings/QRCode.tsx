import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  QrCode as QrCodeIcon,
  Download,
  Share2,
  ArrowLeft,
  Copy,
  Check,
  Calendar,
  Eye,
  Trash2,
} from 'lucide-react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { mockQRCodes } from '../../data/mockDonations';
import toast from 'react-hot-toast';

// Simple QR Code SVG generator (mock)
const generateQRCodeSVG = (data: string): string => {
  // This is a mock QR code - in production, use a library like qrcode.react
  // For now, we'll create a simple pattern
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">QR Code</text>
      <text x="100" y="120" text-anchor="middle" font-size="10" fill="gray">${data.substring(0, 20)}...</text>
    </svg>
  `)}`;
};

export default function QRCode() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    purpose: '',
  });
  const [generatedQR, setGeneratedQR] = useState<{
    id: string;
    title: string;
    amount?: number;
    purpose: string;
    qrData: string;
    createdAt: Date;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Replace with actual API call
    // POST /api/givings/qr-codes
    const qrData = `https://givings.sodzo.com/qr/${formData.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    setGeneratedQR({
      id: `qr-${Date.now()}`,
      title: formData.title,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      purpose: formData.purpose,
      qrData,
      createdAt: new Date(),
    });
    toast.success('QR Code generated successfully!');
  };

  const handleDownload = () => {
    if (generatedQR) {
      // TODO: Implement actual QR code download
      toast.success('QR Code download started!');
    }
  };

  const handleShare = async () => {
    if (generatedQR && navigator.share) {
      try {
        await navigator.share({
          title: generatedQR.title,
          text: generatedQR.purpose,
          url: generatedQR.qrData,
        });
        toast.success('QR Code shared!');
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    if (generatedQR) {
      navigator.clipboard.writeText(generatedQR.qrData);
      setCopied(true);
      toast.success('QR data copied to clipboard!');
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
            Generate QR Code
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Create QR codes for quick donations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form and Generated QR Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form */}
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
                  QR Code Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., General Offering QR"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                  placeholder="Describe the purpose of this QR code..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <QrCodeIcon className="w-5 h-5" />
                Generate QR Code
              </motion.button>
            </form>
          </motion.div>

          {/* Generated QR Display */}
          {generatedQR && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`
                ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
                p-6
              `}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Generated QR Code
                </h3>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </motion.button>
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
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="p-6 bg-white rounded-lg border-2 border-gray-200 dark:border-gray-700">
                  <img
                    src={generateQRCodeSVG(generatedQR.qrData)}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {generatedQR.title}
                  </p>
                  {generatedQR.amount && (
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      ₦{generatedQR.amount.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {generatedQR.purpose}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Previous QR Codes */}
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
              Previous QR Codes
            </h2>
            <div className="space-y-4">
              {mockQRCodes.map((qr) => (
                <div
                  key={qr.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                      {qr.title}
                    </h3>
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                      <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center mb-3 p-2 bg-white dark:bg-gray-800 rounded">
                    <img
                      src={generateQRCodeSVG(qr.qrData)}
                      alt={qr.title}
                      className="w-24 h-24"
                    />
                  </div>
                  {qr.amount && (
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      ₦{qr.amount.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {qr.purpose}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(qr.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {qr.usageCount} uses
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(qr.qrData);
                        toast.success('QR data copied!');
                      }}
                      className="flex-1 py-2 px-3 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center justify-center gap-1">
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement download
                        toast.success('Download started!');
                      }}
                      className="flex-1 py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-1">
                      <Download className="w-3 h-3" />
                      Download
                    </button>
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

