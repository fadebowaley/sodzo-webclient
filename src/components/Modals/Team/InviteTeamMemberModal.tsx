import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface TeamMember {
  name: string;
  email: string;
  status: 'active' | 'invited' | 'pending';
  role?: string;
  avatar?: string;
}

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (member: Omit<TeamMember, 'id'>) => void;
}

export default function InviteTeamMemberModal({
  isOpen,
  onClose,
  onSuccess,
}: InviteTeamMemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const newMember: Omit<TeamMember, 'id'> = {
        name: name.trim(),
        email: email.trim(),
        status: 'invited',
      };

      toast.success('Invitation sent successfully!');
      onSuccess(newMember);
      handleClose();
    } catch (error) {
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setMessage('');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
              {/* Header with Gradient */}
              <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                  }}></div>
                </div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Invite Team Member
                      </h2>
                      <p className="text-blue-100 text-sm mt-0.5">
                        Send an invitation to join your team
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}>
                    <X className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <UserPlus className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      required
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Optional Message Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Personal Message <span className="text-gray-400 font-normal">(Optional)</span>
                    </span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a warm welcome message to personalize the invitation..."
                    rows={4}
                    disabled={loading}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 px-5 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}>
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading || !name.trim() || !email.trim()}
                    className="flex-1 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}>
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send Invitation</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
