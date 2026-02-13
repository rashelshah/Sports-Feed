import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  CheckCircle,
  Shield,
  Heart,
  Star,
  Filter,
  Plus,
  Navigation,
  AlertCircle,
  Zap,
  Loader2,
  Trash2,
  Users
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

// ─── Fix Leaflet default marker icons (Vite bundling breaks them) ────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Custom marker icons by category ─────────────────────────────────────────
function createCategoryIcon(emoji: string, color: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
    className: '',
  });
}

const CATEGORY_ICONS: Record<string, L.DivIcon> = {
  gym: createCategoryIcon('🏋️', '#3b82f6'),
  park: createCategoryIcon('🌳', '#22c55e'),
  studio: createCategoryIcon('🎭', '#a855f7'),
  field: createCategoryIcon('⚽', '#f59e0b'),
  court: createCategoryIcon('🏀', '#f97316'),
  track: createCategoryIcon('🏃', '#ec4899'),
  default: createCategoryIcon('📍', '#6b7280'),
};

const USER_ICON = L.divIcon({
  html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #3b82f6;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: '',
});

// ─── API helpers ─────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ─── Types (frontend-only, matching backend response shapes) ─────────────────
interface SafeLocationResponse {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  category?: string;
  safety_features?: string[];
  is_verified?: boolean;
  verifications_count?: number;
  average_rating?: number;
  total_ratings?: number;
  sports_available?: string[];
  created_by?: string | { id: string; name: string; avatar_url?: string };
  creator_role?: string;
  created_at?: string;
  distance?: number;
  userHasVerified?: boolean;
}

interface CheckInResponse {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  location_name: string;
  activity: string;
  duration: number;
  notes?: string;
  checked_in_at: string;
  user?: { id: string; name: string; avatar_url?: string };
}

interface HeatMapPoint {
  grid_lat: number;
  grid_lng: number;
  activity: string;
  intensity: number;
  total_duration: number;
  last_activity: string;
}

interface UserStats {
  totalCheckIns: number;
  totalDuration: number;
  totalHours: number;
  activityBreakdown: Record<string, number>;
  recentCheckIns: any[];
}

// ─── FlyTo helper component ──────────────────────────────────────────────────
function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function MapPage() {
  const { user, darkMode } = useAuthStore();
  const { getUserTokens, addTokens } = useAppStore();
  const [activeTab, setActiveTab] = useState<'map' | 'checkins' | 'safety'>('map');
  const [mapType, setMapType] = useState<'standard' | 'heatmap' | 'safety'>('standard');
  const [heatMapType, setHeatMapType] = useState<'activity' | 'women-safe' | 'disability-friendly'>('activity');

  // Data state
  const [locations, setLocations] = useState<SafeLocationResponse[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInResponse[]>([]);
  const [heatMapData, setHeatMapData] = useState<HeatMapPoint[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SafeLocationResponse | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [checkInActivity, setCheckInActivity] = useState('unstructured-sports');
  const [checkInDuration, setCheckInDuration] = useState(60);
  const [safetyFeatures, setSafetyFeatures] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [ratingId, setRatingId] = useState<string | null>(null);

  // Default map center — overridden by user geolocation
  const defaultCenter: [number, number] = [20.2961, 85.8245];

  // ─── Geolocation ────────────────────────────────────────────────
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setFlyTarget(loc);
        },
        (err) => console.warn('Geolocation denied:', err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // ─── Fetch all data ─────────────────────────────────────────────
  const fetchLocations = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100', sortBy: 'created_at', sortOrder: 'desc' });
      if (userLocation) {
        params.set('latitude', String(userLocation[0]));
        params.set('longitude', String(userLocation[1]));
        params.set('radius', '50');
        params.set('sortBy', 'distance');
      }
      const res = await fetch(`${API_BASE}/api/locations/safe-locations?${params}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  }, [userLocation]);

  const fetchCheckIns = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/locations/checkins?limit=50`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setCheckIns(data.checkIns || []);
      }
    } catch (err) {
      console.error('Error fetching check-ins:', err);
    }
  }, []);

  const fetchHeatMap = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/locations/heatmap`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setHeatMapData(data.heatMapData || []);
      }
    } catch (err) {
      console.error('Error fetching heatmap:', err);
    }
  }, []);

  const fetchUserStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/locations/stats/user`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setUserStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  }, []);

  useEffect(() => {
    async function loadAll() {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([fetchLocations(), fetchCheckIns(), fetchHeatMap(), fetchUserStats()]);
      } catch (err) {
        setError('Failed to load map data. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, [fetchLocations, fetchCheckIns, fetchHeatMap, fetchUserStats]);

  // ─── Check-in handler ───────────────────────────────────────────
  // Build a set of location names the user has recently checked in to
  const checkedInLocationNames = new Set(
    checkIns.map(ci => ci.location_name?.toLowerCase())
  );

  const isLocationCheckedIn = (loc: SafeLocationResponse) => {
    return checkedInLocationNames.has(loc.name?.toLowerCase());
  };

  const handleCheckIn = async () => {
    if (!selectedLocation || !user) return;

    // If already checked in, show info and close
    if (isLocationCheckedIn(selectedLocation)) {
      toast('You have already checked in at this location', { icon: 'ℹ️' });
      setShowCheckInModal(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/locations/checkin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          locationName: selectedLocation.name,
          activity: checkInActivity,
          duration: checkInDuration,
        }),
      });
      const data = await res.json();

      // Handle duplicate check-in (409)
      if (res.status === 409 && data.alreadyCheckedIn) {
        toast('You have already checked in here in the last 24 hours!', { icon: 'ℹ️' });
        setShowCheckInModal(false);
        await fetchCheckIns(); // refresh to update button state
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Check-in failed');
      }
      const tokensEarned = data.tokensEarned || 0;
      toast.success(`Checked in at ${selectedLocation.name}! +${tokensEarned} tokens earned 🎉`);
      setShowCheckInModal(false);
      // Refresh data + token UI
      await Promise.all([fetchCheckIns(), fetchUserStats(), fetchHeatMap()]);
      await initSession();
    } catch (err: any) {
      toast.error(err.message || 'Failed to check in');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Check if user can create safe locations ──────────────────
  // All authenticated users can create safe locations
  const canCreateSafeLocation = !!user;

  // ─── Mark safe handler ──────────────────────────────────────────
  const handleMarkSafe = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      if (selectedLocation) {
        const res = await fetch(`${API_BASE}/api/locations/safe-locations/${selectedLocation.id}/mark-safe`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ safetyFeatures }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to mark as safe');
        }
        const tokensEarned = data.tokensEarned || 0;
        toast.success(`Location safety verified! ${tokensEarned > 0 ? `+${tokensEarned} tokens earned` : ''} ✅`);
      } else if (userLocation) {
        const res = await fetch(`${API_BASE}/api/locations/safe-locations`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: 'My Location',
            latitude: userLocation[0],
            longitude: userLocation[1],
            address: 'User-reported location',
            category: 'other',
            safetyFeatures,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create safe location');
        }
        toast.success(`Safe location created! +${data.tokensEarned || 25} tokens earned 🎉`);
      }
      setShowSafetyModal(false);
      setSafetyFeatures([]);
      await Promise.all([fetchLocations(), fetchUserStats()]);
      await initSession();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark safe');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Rate location handler ──────────────────────────────────────
  const handleRateLocation = async (locationId: string, rating: number) => {
    if (!user || ratingId) return;
    setRatingId(locationId);
    try {
      // Optimistic update
      setLocations(prev => prev.map(loc =>
        loc.id === locationId ? { ...loc, average_rating: rating, total_ratings: (loc.total_ratings || 0) + 1 } : loc
      ));
      const res = await fetch(`${API_BASE}/api/locations/safe-locations/${locationId}/rate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rating }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to rate');
      }
      // Update with server values
      setLocations(prev => prev.map(loc =>
        loc.id === locationId ? { ...loc, average_rating: data.averageRating, total_ratings: data.totalRatings } : loc
      ));
      toast.success('Rating submitted ⭐');
    } catch (err: any) {
      toast.error(err.message || 'Failed to rate location');
      await fetchLocations();
    } finally {
      setRatingId(null);
    }
  };

  // ─── Get role-based address label ──────────────────────────────
  const getRoleLabel = (loc: SafeLocationResponse) => {
    const role = loc.creator_role || '';
    if (role === 'admin' || role === 'administrator') return 'Platform created';
    if (role === 'coach') return 'Coach reported location';
    return loc.address || 'Community reported';
  };

  // ─── Check if user can delete a location ───────────────────────
  const canDeleteLocation = (loc: SafeLocationResponse) => {
    if (!user) return false;
    const isCreator = typeof loc.created_by === 'string'
      ? loc.created_by === user.id
      : loc.created_by?.id === user.id;
    const isAdmin = ['admin', 'administrator'].includes(user.role || '');
    return isCreator || isAdmin;
  };

  // ─── Delete location handler ──────────────────────────────────
  const handleDeleteLocation = async (locationId: string, locationName: string) => {
    if (!user || deletingId) return;
    if (!window.confirm(`Are you sure you want to delete "${locationName}"?`)) return;
    setDeletingId(locationId);
    try {
      const res = await fetch(`${API_BASE}/api/locations/safe-locations/${locationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete location');
      }
      toast.success('Location deleted successfully');
      await fetchLocations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete location');
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Safety feature toggle ─────────────────────────────────────
  const toggleSafetyFeature = (feature: string) => {
    setSafetyFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const getSafetyIcon = (feature: string) => {
    switch (feature) {
      case 'women-safe': return <Heart className="h-3.5 w-3.5 text-pink-500" />;
      case 'disability-friendly': return <Shield className="h-3.5 w-3.5 text-blue-500" />;
      case 'accessible-parking': return <MapPin className="h-3.5 w-3.5 text-green-500" />;
      case 'accessible-entrance': return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'well-lit': return <Zap className="h-3.5 w-3.5 text-yellow-500" />;
      case 'security-present': return <Shield className="h-3.5 w-3.5 text-red-500" />;
      default: return <AlertCircle className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  const getHeatColor = (activity: string, intensity: number) => {
    const opacity = Math.min(0.7, Math.max(0.15, intensity * 0.1));
    switch (activity) {
      case 'coco': return { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: opacity };
      case 'martial-arts': return { color: '#ef4444', fillColor: '#ef4444', fillOpacity: opacity };
      case 'calorie-fight': return { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: opacity };
      case 'adaptive-sports': return { color: '#22c55e', fillColor: '#22c55e', fillOpacity: opacity };
      default: return { color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: opacity };
    }
  };

  const getCategoryEmoji = (category?: string) => {
    switch (category) {
      case 'gym': return '🏋️';
      case 'park': return '🌳';
      case 'studio': return '🎭';
      case 'field': return '⚽';
      case 'court': return '🏀';
      case 'track': return '🏃';
      default: return '📍';
    }
  };

  const getCategoryIcon = (loc: SafeLocationResponse) => {
    return CATEGORY_ICONS[loc.category || 'default'] || CATEGORY_ICONS.default;
  };

  if (!user) return null;
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className={`rounded-lg shadow-md p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sports Map</h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Discover sports locations, check in, and mark safe spaces</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{checkIns.length}</span> check-ins today
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{locations.length}</span> safe locations
            </div>
            {userStats && (
              <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userStats.totalHours}</span> hrs active
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`flex space-x-1 rounded-lg p-1 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {[
          { id: 'map', label: 'Map View', icon: MapPin },
          { id: 'checkins', label: 'My Check-ins', icon: CheckCircle },
          { id: 'safety', label: 'Safety Map', icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? darkMode
                  ? 'bg-gray-700 text-blue-400 shadow-sm'
                  : 'bg-white text-blue-600 shadow-sm'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className={`rounded-xl shadow-md p-12 flex flex-col items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading map data...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className={`border rounded-xl p-6 text-center mb-6 ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <AlertCircle className={`h-8 w-8 mx-auto mb-2 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
          <p className={darkMode ? 'text-red-300' : 'text-red-700'}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`mt-3 px-4 py-2 rounded-lg transition ${darkMode ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
          >
            Retry
          </button>
        </div>
      )}

      {/* ═══ MAP VIEW TAB ═══ */}
      {!isLoading && !error && activeTab === 'map' && (
        <div className="space-y-6">
          {/* Map Controls */}
          <div className={`rounded-lg shadow-md p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Map Type:</span>
              </div>
              {([
                { id: 'standard' as const, label: 'Standard' },
                { id: 'heatmap' as const, label: 'Heat Map' },
                { id: 'safety' as const, label: 'Safety View' },
              ]).map((type) => (
                <button
                  key={type.id}
                  onClick={() => setMapType(type.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    mapType === type.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}

              {mapType === 'heatmap' && (
                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-sm text-gray-600">Heat Type:</span>
                  {[
                    { id: 'activity' as const, label: 'Activity' },
                    { id: 'women-safe' as const, label: 'Women Safe' },
                    { id: 'disability-friendly' as const, label: 'Accessible' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setHeatMapType(type.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        heatMapType === type.id
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Leaflet Map */}
          <div className={`rounded-xl shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <MapContainer
              center={userLocation || defaultCenter}
              zoom={13}
              style={{ height: '480px', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FlyToLocation position={flyTarget} />

              {/* User location marker */}
              {userLocation && (
                <Marker position={userLocation} icon={USER_ICON}>
                  <Popup>
                    <strong>You are here</strong>
                  </Popup>
                </Marker>
              )}

              {/* Location markers */}
              {locations.map((loc) => (
                <Marker
                  key={loc.id}
                  position={[loc.latitude, loc.longitude]}
                  icon={getCategoryIcon(loc)}
                  eventHandlers={{
                    click: () => setSelectedLocation(loc),
                  }}
                >
                  <Popup maxWidth={280}>
                    <div style={{ fontSize: '14px' }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{loc.name}</h3>
                      {loc.address && <p style={{ color: '#666', marginBottom: '4px' }}>{loc.address}</p>}
                      {loc.description && <p style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>{loc.description}</p>}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                        {(loc.safety_features || []).slice(0, 4).map((f: string, i: number) => (
                          <span key={i} style={{ display: 'inline-block', background: '#f0fdf4', color: '#166534', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                            {f.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                        {loc.verifications_count !== undefined && (
                          <span>✅ {loc.verifications_count} verifications</span>
                        )}
                        {loc.distance !== undefined && (
                          <span>📍 {loc.distance.toFixed(1)} km</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => { setSelectedLocation(loc); setShowCheckInModal(true); }}
                          style={{ flex: 1, background: '#2563eb', color: 'white', fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                        >
                          Check In
                        </button>
                        <button
                          onClick={() => { setSelectedLocation(loc); setShowSafetyModal(true); }}
                          style={{ flex: 1, background: '#16a34a', color: 'white', fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                        >
                          Verify Safe
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Heatmap overlay (circles with popups) */}
              {mapType === 'heatmap' && heatMapData.map((pt, i) => (
                <Circle
                  key={`heat-${i}`}
                  center={[pt.grid_lat, pt.grid_lng]}
                  radius={Math.max(200, pt.intensity * 100)}
                  pathOptions={getHeatColor(pt.activity, pt.intensity)}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold capitalize">{pt.activity.replace(/-/g, ' ')}</p>
                      <p className="text-gray-600">{pt.intensity} check-in{pt.intensity !== 1 ? 's' : ''}</p>
                      <p className="text-gray-500 text-xs">{Math.round(pt.total_duration / 60)}h total activity</p>
                    </div>
                  </Popup>
                </Circle>
              ))}

              {/* Safety view — highlight safe locations */}
              {mapType === 'safety' && locations
                .filter((loc) => (loc.safety_features || []).length > 0)
                .map((loc) => (
                  <Circle
                    key={`safe-${loc.id}`}
                    center={[loc.latitude, loc.longitude]}
                    radius={300}
                    pathOptions={{
                      color: '#22c55e',
                      fillColor: '#22c55e',
                      fillOpacity: 0.2,
                      weight: 2,
                    }}
                  />
                ))}
            </MapContainer>
          </div>

          {/* Location List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                onClick={() => setSelectedLocation(location)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getCategoryEmoji(location.category)}</span>
                    <div>
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{location.name}</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{location.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{(location.average_rating || 0).toFixed(1)}</span>
                  </div>
                </div>

                <div className={`flex items-center justify-between text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{location.verifications_count || 0} verified</span>
                  </div>
                  {location.distance !== undefined && (
                    <span>{location.distance.toFixed(1)} km</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {(location.safety_features || []).slice(0, 3).map((feature: string, index: number) => (
                    <div key={index} className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {getSafetyIcon(feature)}
                      <span className="capitalize">{feature.replace('-', ' ')}</span>
                    </div>
                  ))}
                  {(location.safety_features || []).length > 3 && (
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>+{(location.safety_features || []).length - 3} more</span>
                  )}
                </div>

                  <Button
                    onClick={() => {
                      setSelectedLocation(location);
                      if (isLocationCheckedIn(location)) {
                        toast('You have already checked in at this location', { icon: 'ℹ️' });
                      } else {
                        setShowCheckInModal(true);
                      }
                    }}
                    size="sm"
                    className={`w-full ${isLocationCheckedIn(location)
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : ''
                      }`}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {isLocationCheckedIn(location) ? 'Checked In ✓' : 'Check In'}
                  </Button>
                </motion.div>
              ))}
            </div>

          {/* Empty state */}
          {locations.length === 0 && !isLoading && (
            <div className={`rounded-xl shadow-md p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <MapPin className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No locations found</h3>
              <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Be the first to add a safe location in your area!</p>
              <Button onClick={() => { setSelectedLocation(null); setShowSafetyModal(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                Add Safe Location
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ═══ CHECK-INS TAB ═══ */}
      {!isLoading && activeTab === 'checkins' && (
        <div className="space-y-6">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Check-ins</h2>
          
          {checkIns.length === 0 ? (
            <div className={`rounded-lg shadow-md p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <CheckCircle className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No check-ins yet</h3>
              <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start exploring and check in at sports locations to earn tokens!</p>
              <Button onClick={() => setActiveTab('map')}>
                Explore Map
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {checkIns.map((ci) => (
                <motion.div
                  key={ci.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg shadow-md p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                        <CheckCircle className={`h-5 w-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ci.location_name}</h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(ci.checked_in_at).toLocaleDateString()} at{' '}
                          {new Date(ci.checked_in_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>+5 tokens</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Check-in</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ SAFETY TAB ═══ */}
      {!isLoading && activeTab === 'safety' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Safe Locations</h2>
            <Button
              onClick={() => setShowSafetyModal(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Mark Safe Location
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.filter(loc => (loc.safety_features || []).length > 0).map((location) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg shadow-md p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{location.name}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{location.address}</p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{(location.average_rating || 0).toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {(location.safety_features || []).map((feature: string, index: number) => (
                    <div key={index} className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>
                      {getSafetyIcon(feature)}
                      <span className="capitalize">{feature.replace('-', ' ')}</span>
                    </div>
                  ))}
                  {(location.safety_features || []).length > 3 && (
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>+{(location.safety_features || []).length - 3} more</span>
                  )}
                </div>

                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Verified by {location.verifications_count || 0} users
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ CHECK-IN MODAL ═══ */}
      {showCheckInModal && selectedLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg p-6 max-w-md w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Check in at {selectedLocation.name}
            </h3>

            <div className="space-y-4">
              <div className={`flex items-center space-x-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <MapPin className="h-4 w-4" />
                <span>{selectedLocation.address || `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}</span>
              </div>
              
              <div className={`flex items-center space-x-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Users className="h-4 w-4" />
                <span>Check-in location</span>
              </div>

              <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                  <strong>Reward:</strong> Earn 5 tokens for checking in!
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleCheckIn} className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                {isSubmitting ? 'Checking in...' : 'Check In'}
              </Button>
              <Button variant="outline" onClick={() => setShowCheckInModal(false)} className="flex-1" disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══ SAFETY MODAL ═══ */}
      {showSafetyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg p-6 max-w-md w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Mark Location as Safe
            </h3>

            <div className="space-y-4">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select the safety features available at this location:
              </p>
              
              <div className="space-y-2">
                {[
                  'women-safe',
                  'disability-friendly',
                  'accessible-parking',
                  'accessible-entrance',
                  'accessible-restrooms',
                  'well-lit',
                  'security-present',
                ].map((feature) => (
                  <label key={feature} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={safetyFeatures.includes(feature)}
                      onChange={() => toggleSafetyFeature(feature)}
                      className={`rounded text-blue-600 focus:ring-blue-500 ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300'}`}
                    />
                    <span className={`text-sm capitalize ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {feature.replace('-', ' ')}
                    </span>
                  </label>
                ))}
              </div>

              <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                  <strong>Reward:</strong> Earn 10 tokens for marking a safe location!
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleMarkSafe}
                className="flex-1"
                disabled={isSubmitting || safetyFeatures.length === 0}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Shield className="h-4 w-4 mr-1" />}
                {isSubmitting ? 'Saving...' : selectedLocation ? 'Verify Safe' : 'Mark Safe'}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowSafetyModal(false); setSafetyFeatures([]); }}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
