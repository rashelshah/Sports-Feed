import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Heart, Star, Calendar, MapPin, Clock, Video, BookOpen, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface WomensEvent {
  id: string;
  title: string;
  description: string;
  organizer: {
    id: string;
    name: string;
    profileImage?: string;
    isVerified: boolean;
  };
  location: string;
  date: string;
  time: string;
  maxParticipants: number;
  currentParticipants: number;
  category: string;
  isOnline: boolean;
  tokenCost: number;
  features: string[];
  rating: number;
  totalRatings: number;
}

interface WomensCoach {
  id: string;
  name: string;
  profileImage?: string;
  bio: string;
  specialty: string;
  rating: number;
  totalRatings: number;
  followers: number;
  isVerified: boolean;
  isOnline: boolean;
}

interface WomensContent {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'workout';
  thumbnail?: string;
  duration?: string;
  author: {
    name: string;
    profileImage?: string;
  };
  views: number;
  likes: number;
  category: string;
  isPremium: boolean;
  tokenCost: number;
}

export function WomensLounge() {
  const { user } = useAuthStore();
  const { getUserTokens, spendTokens } = useAppStore();
  const [activeTab, setActiveTab] = useState<'events' | 'coaches' | 'content'>('events');
  const [events, setEvents] = useState<WomensEvent[]>([]);
  const [coaches, setCoaches] = useState<WomensCoach[]>([]);
  const [content, setContent] = useState<WomensContent[]>([]);

  // Check if user is female
  const isFemale = user?.gender === 'female';

  useEffect(() => {
    // Mock data for women's events
    setEvents([
      {
        id: '1',
        title: 'Women\'s Self-Defense Workshop',
        description: 'Learn essential self-defense techniques in a safe, supportive environment designed specifically for women.',
        organizer: {
          id: '1',
          name: 'Sarah Johnson',
          profileImage: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=400',
          isVerified: true,
        },
        location: 'Downtown Community Center',
        date: '2024-01-15',
        time: '10:00 AM',
        maxParticipants: 20,
        currentParticipants: 12,
        category: 'Martial Arts',
        isOnline: false,
        tokenCost: 50,
        features: ['Beginner-friendly', 'Equipment provided', 'Safe environment'],
        rating: 4.8,
        totalRatings: 24,
      },
      {
        id: '2',
        title: 'Women\'s Fitness Bootcamp',
        description: 'High-energy workout session designed for women of all fitness levels. Build strength and confidence!',
        organizer: {
          id: '2',
          name: 'Maria Garcia',
          profileImage: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
          isVerified: true,
        },
        location: 'Online - Zoom',
        date: '2024-01-16',
        time: '7:00 PM',
        maxParticipants: 30,
        currentParticipants: 18,
        category: 'Fitness',
        isOnline: true,
        tokenCost: 30,
        features: ['All levels welcome', 'Equipment optional', 'Recorded session'],
        rating: 4.9,
        totalRatings: 45,
      },
    ]);

    // Mock data for women coaches
    setCoaches([
      {
        id: '1',
        name: 'Sarah Johnson',
        profileImage: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=400',
        bio: 'Certified martial arts instructor with 10+ years experience. Specializes in women\'s self-defense and empowerment.',
        specialty: 'Martial Arts & Self-Defense',
        rating: 4.9,
        totalRatings: 156,
        followers: 2500,
        isVerified: true,
        isOnline: true,
      },
      {
        id: '2',
        name: 'Maria Garcia',
        profileImage: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
        bio: 'Fitness coach and nutritionist specializing in women\'s health and wellness. Creating safe spaces for women to thrive.',
        specialty: 'Fitness & Nutrition',
        rating: 4.8,
        totalRatings: 89,
        followers: 1200,
        isVerified: true,
        isOnline: false,
      },
    ]);

    // Mock data for women's content
    setContent([
      {
        id: '1',
        title: 'Building Confidence Through Martial Arts',
        description: 'A comprehensive guide to developing self-confidence and personal safety skills.',
        type: 'video',
        thumbnail: 'https://images.pexels.com/photos/4752861/pexels-photo-4752861.jpeg?auto=compress&cs=tinysrgb&w=800',
        duration: '15:30',
        author: {
          name: 'Sarah Johnson',
          profileImage: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=400',
        },
        views: 1250,
        likes: 89,
        category: 'Self-Defense',
        isPremium: false,
        tokenCost: 0,
      },
      {
        id: '2',
        title: 'Women\'s Health & Fitness Guide',
        description: 'Expert advice on nutrition, exercise, and wellness specifically tailored for women.',
        type: 'article',
        author: {
          name: 'Maria Garcia',
          profileImage: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
        },
        views: 890,
        likes: 67,
        category: 'Health & Wellness',
        isPremium: true,
        tokenCost: 25,
      },
    ]);
  }, []);

  const handleJoinEvent = async (event: WomensEvent) => {
    if (!user) return;
    
    const userTokens = getUserTokens(user.id);
    if (userTokens.balance < event.tokenCost) {
      toast.error('Insufficient tokens. Please purchase more tokens to join this event.');
      return;
    }

    const success = spendTokens(user.id, event.tokenCost, 'event', `Joined ${event.title}`);
    if (success) {
      toast.success(`Successfully joined ${event.title}!`);
      // Update event participants
      setEvents(prev => prev.map(e => 
        e.id === event.id 
          ? { ...e, currentParticipants: e.currentParticipants + 1 }
          : e
      ));
    } else {
      toast.error('Failed to join event. Please try again.');
    }
  };

  const handleAccessContent = async (contentItem: WomensContent) => {
    if (!user) return;
    
    if (contentItem.isPremium) {
      const userTokens = getUserTokens(user.id);
      if (userTokens.balance < contentItem.tokenCost) {
        toast.error('Insufficient tokens. Please purchase more tokens to access this content.');
        return;
      }

      const success = spendTokens(user.id, contentItem.tokenCost, 'content', `Accessed ${contentItem.title}`);
      if (!success) {
        toast.error('Failed to access content. Please try again.');
        return;
      }
    }

    toast.success(`Accessing ${contentItem.title}...`);
    // Here you would typically open the content in a modal or navigate to a content page
  };

  if (!isFemale) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-8 text-center">
          <Shield className="h-16 w-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Women's Lounge</h2>
          <p className="text-gray-600 mb-6">
            This space is exclusively for women athletes and organizers. It provides a safe, supportive environment 
            for women to connect, learn, and grow together in sports.
          </p>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Why Women's Lounge?</h3>
            <ul className="text-left text-gray-600 space-y-2">
              <li>• Safe space for women to share experiences</li>
              <li>• Female-focused coaching and mentorship</li>
              <li>• Events designed specifically for women's needs</li>
              <li>• Supportive community of women athletes</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="bg-pink-100 p-3 rounded-full">
            <Heart className="h-8 w-8 text-pink-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Women's Lounge</h1>
            <p className="text-gray-600">A safe space for women athletes to connect, learn, and grow together</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8">
        {[
          { id: 'events', label: 'Events', icon: Calendar },
          { id: 'coaches', label: 'Coaches', icon: Users },
          { id: 'content', label: 'Content', icon: BookOpen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
          <div className="grid gap-6">
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-4">{event.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {event.features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-pink-100 text-pink-700 text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{event.rating}</span>
                      <span className="text-sm text-gray-500">({event.totalRatings})</span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      {event.currentParticipants}/{event.maxParticipants} participants
                    </div>
                    <div className="text-lg font-bold text-pink-600 mb-3">
                      {event.tokenCost} tokens
                    </div>
                    <Button
                      onClick={() => handleJoinEvent(event)}
                      disabled={event.currentParticipants >= event.maxParticipants}
                      size="sm"
                    >
                      {event.currentParticipants >= event.maxParticipants ? 'Full' : 'Join Event'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Coaches Tab */}
      {activeTab === 'coaches' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Women Coaches</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {coaches.map((coach) => (
              <motion.div
                key={coach.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img
                      src={coach.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={coach.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    {coach.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{coach.name}</h3>
                      {coach.isVerified && (
                        <Shield className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{coach.bio}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{coach.rating}</span>
                        <span>({coach.totalRatings})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{coach.followers} followers</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button size="sm">
                        Follow
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Women's Content</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {item.thumbnail && (
                  <div className="relative">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                    {item.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {item.duration}
                      </div>
                    )}
                    {item.isPremium && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        Premium
                      </div>
                    )}
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Video className="h-4 w-4" />
                      <span>{item.views} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{item.likes} likes</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      by {item.author.name}
                    </div>
                    <Button
                      onClick={() => handleAccessContent(item)}
                      size="sm"
                      variant={item.isPremium ? "default" : "outline"}
                    >
                      {item.isPremium ? `${item.tokenCost} tokens` : 'Free'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
