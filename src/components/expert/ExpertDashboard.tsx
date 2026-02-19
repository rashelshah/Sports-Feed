import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import toast from 'react-hot-toast';

interface PendingCoach {
  id: string;
  full_name: string;
  email: string;
  username: string;
  bio?: string;
  profile_image?: string;
  sports_category?: string;
  created_at: string;
  approval_status: string;
}

export function ExpertDashboard() {
  const { user, darkMode } = useAuthStore();
  const { setCurrentView } = useAppStore();
  const [pendingCoaches, setPendingCoaches] = useState<PendingCoach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'approve' | 'reject';
    coachId: string;
    coachName: string;
  } | null>(null);

  // Guard: only expert can access
  useEffect(() => {
    if (user && user.role !== 'expert') {
      setCurrentView('home');
      toast.error('Access denied. Expert role required.');
    }
  }, [user, setCurrentView]);

  // Fetch pending coaches
  useEffect(() => {
    fetchPendingCoaches();
  }, []);

  const fetchPendingCoaches = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/expert/pending-coaches`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setPendingCoaches(data.coaches || []);
      } else {
        console.error('Failed to fetch pending coaches:', data.error);
      }
    } catch (err) {
      console.error('Error fetching pending coaches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (coachId: string, action: 'approve' | 'reject') => {
    setActionLoading(coachId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/expert/${action}-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: coachId }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(action === 'approve' ? 'Coach approved successfully!' : 'Coach request rejected.');
        setPendingCoaches(prev => prev.filter(c => c.id !== coachId));
      } else {
        toast.error(data.error || `Failed to ${action} coach`);
      }
    } catch (err) {
      toast.error(`Failed to ${action} coach`);
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  if (user?.role !== 'expert') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className={`h-7 w-7 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
            Expert Panel
          </h1>
        </div>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Review and approve pending coach registrations
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className={`p-5 rounded-2xl ${darkMode ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-yellow-500">{pendingCoaches.length}</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
            </div>
          </div>
        </div>
        <div className={`p-5 rounded-2xl ${darkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-500">—</p>
              <p className="text-sm text-green-600 dark:text-green-400">Approved</p>
            </div>
          </div>
        </div>
        <div className={`p-5 rounded-2xl ${darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-500">—</p>
              <p className="text-sm text-red-600 dark:text-red-400">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Coach Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-white/40 mb-4" />
          <p className={darkMode ? 'text-gray-500' : 'text-gray-500'}>Loading pending requests...</p>
        </div>
      ) : pendingCoaches.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl ${darkMode ? 'bg-white/[0.03] border border-white/10' : 'bg-white border border-gray-200'}`}>
          <CheckCircle className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-green-400/60' : 'text-green-500'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>All caught up!</h3>
          <p className={darkMode ? 'text-gray-500' : 'text-gray-500'}>No pending coach requests at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingCoaches.map((coach) => (
            <motion.div
              key={coach.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`expert-card p-5 ${!darkMode ? 'bg-white border-gray-200 shadow-md' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar & Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <img
                    src={coach.profile_image || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={coach.full_name}
                    className="h-14 w-14 rounded-full object-cover border-2 border-white/10 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {coach.full_name}
                    </h3>
                    <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {coach.email}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {coach.sports_category && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          {coach.sports_category.replace('-', ' ')}
                        </span>
                      )}
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Signed up {new Date(coach.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {coach.bio && (
                      <p className={`text-sm mt-2 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {coach.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 sm:flex-col sm:w-auto w-full">
                  <button
                    onClick={() => setConfirmModal({ open: true, type: 'approve', coachId: coach.id, coachName: coach.full_name })}
                    disabled={actionLoading === coach.id}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => setConfirmModal({ open: true, type: 'reject', coachId: coach.id, coachName: coach.full_name })}
                    disabled={actionLoading === coach.id}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${darkMode
                      ? 'bg-white/10 hover:bg-red-600/30 text-red-400 border border-white/10'
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                      }`}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal?.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="confirm-modal-backdrop"
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={`confirm-modal ${!darkMode ? 'bg-white border-gray-200' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {confirmModal.type === 'approve' ? 'Approve Coach' : 'Reject Request'}
              </h3>
              <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {confirmModal.type === 'approve'
                  ? `Are you sure you want to approve ${confirmModal.coachName} as a coach? This will grant them full coach access.`
                  : `Are you sure you want to reject ${confirmModal.coachName}'s request? This action cannot be undone.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${darkMode
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(confirmModal.coachId, confirmModal.type)}
                  disabled={actionLoading === confirmModal.coachId}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 ${confirmModal.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  {actionLoading === confirmModal.coachId ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}