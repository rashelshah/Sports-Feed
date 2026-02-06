import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  CheckCircle, 
  Shield, 
  Heart, 
  Users, 
  Star, 
  Filter, 
  Plus, 
  Navigation,
  Clock,
  AlertCircle,
  ThumbsUp,
  Eye,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { LocationCheckIn, SafeLocation, HeatMapData, Event } from '../../types';

interface MapLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  type: 'gym' | 'park' | 'studio' | 'field' | 'court' | 'track';
  isActive: boolean;
  currentUsers: number;
  maxCapacity?: number;
  safetyFeatures: string[];
  rating: number;
  totalRatings: number;
  lastCheckIn?: string;
  events: Event[];
}

export function MapPage() {
  const { user } = useAuthStore();
  const { getUserTokens, addTokens } = useAppStore();
  const [activeTab, setActiveTab] = useState<'map' | 'checkins' | 'safety'>('map');
  const [mapType, setMapType] = useState<'standard' | 'heatmap' | 'safety'>('standard');
  const [heatMapType, setHeatMapType] = useState<'activity' | 'women-safe' | 'disability-friendly'>('activity');
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [safeLocations, setSafeLocations] = useState<SafeLocation[]>([]);
  const [userCheckIns, setUserCheckIns] = useState<LocationCheckIn[]>([]);
  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mock data for locations
    setLocations([
      {
        id: '1',
        name: 'Downtown Fitness Center',
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St, New York, NY',
        type: 'gym',
        isActive: true,
        currentUsers: 15,
        maxCapacity: 50,
        safetyFeatures: ['well-lit', 'security-present', 'accessible-parking'],
        rating: 4.5,
        totalRatings: 120,
        events: []
      },
      {
        id: '2',
        name: 'Central Park Running Track',
        latitude: 40.7829,
        longitude: -73.9654,
        address: 'Central Park, New York, NY',
        type: 'track',
        isActive: true,
        currentUsers: 8,
        safetyFeatures: ['well-lit', 'accessible-entrance'],
        rating: 4.8,
        totalRatings: 89,
        events: []
      },
      {
        id: '3',
        name: 'Women\'s Self-Defense Studio',
        latitude: 40.7589,
        longitude: -73.9851,
        address: '456 Broadway, New York, NY',
        type: 'studio',
        isActive: true,
        currentUsers: 12,
        maxCapacity: 20,
        safetyFeatures: ['women-safe', 'well-lit', 'security-present', 'accessible-entrance'],
        rating: 4.9,
        totalRatings: 45,
        events: []
      }
    ]);

    // Mock data for safe locations
    setSafeLocations([
      {
        id: '1',
        name: 'Downtown Fitness Center',
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St, New York, NY',
        safetyFeatures: ['women-safe', 'disability-friendly', 'accessible-parking', 'well-lit', 'security-present'],
        verifiedBy: ['user1', 'user2', 'user3'],
        reportedBy: 'user1',
        lastVerified: '2024-01-10T10:00:00Z',
        description: 'Well-maintained facility with excellent safety measures',
        sportsAvailable: ['martial-arts', 'calorie-fight'],
        averageRating: 4.7,
        totalRatings: 156
      },
      {
        id: '2',
        name: 'Central Park Running Track',
        latitude: 40.7829,
        longitude: -73.9654,
        address: 'Central Park, New York, NY',
        safetyFeatures: ['women-safe', 'disability-friendly', 'accessible-entrance', 'well-lit'],
        verifiedBy: ['user4', 'user5'],
        reportedBy: 'user4',
        lastVerified: '2024-01-08T15:30:00Z',
        description: 'Open space with good visibility and accessibility features',
        sportsAvailable: ['calorie-fight', 'unstructured-sports'],
        averageRating: 4.6,
        totalRatings: 89
      }
    ]);

    // Mock heat map data
    setHeatMapData([
      {
        latitude: 40.7128,
        longitude: -74.0060,
        intensity: 0.8,
        type: 'activity',
        timestamp: new Date().toISOString(),
        userCount: 15
      },
      {
        latitude: 40.7829,
        longitude: -73.9654,
        intensity: 0.6,
        type: 'activity',
        timestamp: new Date().toISOString(),
        userCount: 8
      },
      {
        latitude: 40.7589,
        longitude: -73.9851,
        intensity: 0.9,
        type: 'women-safe',
        timestamp: new Date().toISOString(),
        userCount: 12
      }
    ]);

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const handleCheckIn = async (location: MapLocation) => {
    if (!user) return;

    const checkIn: LocationCheckIn = {
      id: Date.now().toString(),
      userId: user.id,
      user: user,
      locationId: location.id,
      locationName: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      checkInType: 'general',
      createdAt: new Date().toISOString()
    };

    setUserCheckIns(prev => [checkIn, ...prev]);
    
    // Award tokens for checking in
    addTokens(user.id, 5, 'earned', `Checked in at ${location.name}`);
    
    // Update location user count
    setLocations(prev => prev.map(loc => 
      loc.id === location.id 
        ? { ...loc, currentUsers: loc.currentUsers + 1, lastCheckIn: new Date().toISOString() }
        : loc
    ));

    // Update heat map data
    setHeatMapData(prev => prev.map(data => 
      data.latitude === location.latitude && data.longitude === location.longitude
        ? { ...data, userCount: data.userCount + 1, intensity: Math.min(1, data.intensity + 0.1) }
        : data
    ));

    toast.success(`Checked in at ${location.name}! +5 tokens earned`);
    setShowCheckInModal(false);
  };

  const handleMarkSafe = async (location: MapLocation, safetyFeatures: string[]) => {
    if (!user) return;

    const safeLocation: SafeLocation = {
      id: Date.now().toString(),
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      safetyFeatures,
      verifiedBy: [user.id],
      reportedBy: user.id,
      lastVerified: new Date().toISOString(),
      description: `Marked as safe by ${user.fullName}`,
      sportsAvailable: [user.sportsCategory],
      averageRating: 0,
      totalRatings: 0
    };

    setSafeLocations(prev => [safeLocation, ...prev]);
    
    // Award tokens for marking safety
    addTokens(user.id, 10, 'earned', `Marked ${location.name} as safe`);
    
    toast.success(`Location marked as safe! +10 tokens earned`);
    setShowSafetyModal(false);
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'gym': return '🏋️';
      case 'park': return '🌳';
      case 'studio': return '🎭';
      case 'field': return '⚽';
      case 'court': return '🏀';
      case 'track': return '🏃';
      default: return '📍';
    }
  };

  const getSafetyIcon = (feature: string) => {
    switch (feature) {
      case 'women-safe': return <Heart className="h-4 w-4 text-pink-500" />;
      case 'disability-friendly': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'accessible-parking': return <MapPin className="h-4 w-4 text-green-500" />;
      case 'accessible-entrance': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'well-lit': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'security-present': return <Shield className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHeatMapColor = (intensity: number, type: string) => {
    const opacity = Math.max(0.3, intensity);
    switch (type) {
      case 'activity': return `rgba(59, 130, 246, ${opacity})`; // Blue
      case 'women-safe': return `rgba(236, 72, 153, ${opacity})`; // Pink
      case 'disability-friendly': return `rgba(34, 197, 94, ${opacity})`; // Green
      default: return `rgba(156, 163, 175, ${opacity})`; // Gray
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sports Map</h1>
            <p className="text-gray-600">Discover sports locations, check in, and mark safe spaces</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{userCheckIns.length}</span> check-ins today
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{safeLocations.length}</span> safe locations
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
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
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Map View */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          {/* Map Controls */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Map Type:</span>
              </div>
              
              {[
                { id: 'standard', label: 'Standard' },
                { id: 'heatmap', label: 'Heat Map' },
                { id: 'safety', label: 'Safety View' }
              ].map((type) => (
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
                    { id: 'activity', label: 'Activity' },
                    { id: 'women-safe', label: 'Women Safe' },
                    { id: 'disability-friendly', label: 'Accessible' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setHeatMapType(type.id as any)}
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

          {/* Map Container */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-96 bg-gray-100 relative" ref={mapRef}>
              {/* Mock Map - In a real app, this would be a proper map component like Google Maps or Mapbox */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Interactive Map</h3>
                  <p className="text-gray-600">Map integration would go here</p>
                </div>
              </div>

              {/* Location Markers */}
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{
                    left: `${((location.longitude + 180) / 360) * 100}%`,
                    top: `${((90 - location.latitude) / 180) * 100}%`
                  }}
                  onClick={() => setSelectedLocation(location)}
                >
                  <div className="bg-white rounded-full p-2 shadow-lg border-2 border-blue-500 hover:border-blue-600 transition-colors">
                    <span className="text-lg">{getLocationIcon(location.type)}</span>
                  </div>
                  {location.currentUsers > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {location.currentUsers}
                    </div>
                  )}
                </div>
              ))}

              {/* Heat Map Overlay */}
              {mapType === 'heatmap' && heatMapData
                .filter(data => data.type === heatMapType)
                .map((data, index) => (
                  <div
                    key={index}
                    className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${((data.longitude + 180) / 360) * 100}%`,
                      top: `${((90 - data.latitude) / 180) * 100}%`,
                      width: `${Math.max(20, data.intensity * 100)}px`,
                      height: `${Math.max(20, data.intensity * 100)}px`,
                      backgroundColor: getHeatMapColor(data.intensity, data.type),
                      opacity: 0.6
                    }}
                  />
                ))}
            </div>
          </div>

          {/* Location List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedLocation(location)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getLocationIcon(location.type)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-600">{location.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{location.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{location.currentUsers} active</span>
                  </div>
                  {location.maxCapacity && (
                    <span>Max: {location.maxCapacity}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {location.safetyFeatures.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                      {getSafetyIcon(feature)}
                      <span className="capitalize">{feature.replace('-', ' ')}</span>
                    </div>
                  ))}
                  {location.safetyFeatures.length > 3 && (
                    <span className="text-xs text-gray-500">+{location.safetyFeatures.length - 3} more</span>
                  )}
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLocation(location);
                    setShowCheckInModal(true);
                  }}
                  size="sm"
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Check In
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Check-ins Tab */}
      {activeTab === 'checkins' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">My Check-ins</h2>
          
          {userCheckIns.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No check-ins yet</h3>
              <p className="text-gray-600 mb-4">Start exploring and check in at sports locations to earn tokens!</p>
              <Button onClick={() => setActiveTab('map')}>
                Explore Map
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {userCheckIns.map((checkIn) => (
                <motion.div
                  key={checkIn.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{checkIn.locationName}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(checkIn.createdAt).toLocaleDateString()} at{' '}
                          {new Date(checkIn.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-green-600 font-medium">+5 tokens</div>
                      <div className="text-xs text-gray-500">Check-in</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Safety Map Tab */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Safe Locations</h2>
            <Button
              onClick={() => setShowSafetyModal(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Mark Safe Location
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeLocations.map((location) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-600">{location.address}</p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{location.averageRating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {location.safetyFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded text-xs">
                      {getSafetyIcon(feature)}
                      <span className="capitalize">{feature.replace('-', ' ')}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-500">
                  Verified by {location.verifiedBy.length} users
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckInModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Check in at {selectedLocation.name}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{selectedLocation.address}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{selectedLocation.currentUsers} people currently here</span>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Reward:</strong> Earn 5 tokens for checking in!
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => handleCheckIn(selectedLocation)}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Check In
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCheckInModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Safety Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mark Location as Safe
            </h3>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
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
                  'security-present'
                ].map((feature) => (
                  <label key={feature} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {feature.replace('-', ' ')}
                    </span>
                  </label>
                ))}
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Reward:</strong> Earn 10 tokens for marking a safe location!
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => {
                  // In a real app, you'd collect the selected features
                  const features = ['women-safe', 'disability-friendly'];
                  handleMarkSafe(selectedLocation!, features);
                }}
                className="flex-1"
              >
                <Shield className="h-4 w-4 mr-1" />
                Mark Safe
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSafetyModal(false)}
                className="flex-1"
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
