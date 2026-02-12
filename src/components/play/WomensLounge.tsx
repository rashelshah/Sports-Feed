import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Heart, Star, Calendar, MapPin, Clock, Video, BookOpen, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
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
  const { user, darkMode } = useAuthStore();
  const { getUserTokens, spendTokens } = useAppStore();
  const [activeTab, setActiveTab] = useState<'events' | 'coaches' | 'content'>('events');
  const [events, setEvents] = useState<WomensEvent[]>([]);
  const [coaches, setCoaches] = useState<WomensCoach[]>([]);
  const [content, setContent] = useState<WomensContent[]>([]);

  // Check if user is female
  const isFemale = user?.gender === 'female';

  useEffect(() => {
    // Fetch real women's events from Supabase
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_women_only', true)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setEvents(data.map((e: any) => ({
            id: e.id,
            title: e.title ?? 'Untitled Event',
            description: e.description ?? '',
            organizer: {
              id: e.organizer_id ?? '',
              name: e.organizer_name ?? 'Unknown',
              profileImage: e.organizer_image,
              isVerified: e.organizer_verified ?? false,
            },
            location: e.location_name ?? e.location?.name ?? 'TBD',
            date: e.start_time ? new Date(e.start_time).toLocaleDateString() : 'TBD',
            time: e.start_time ? new Date(e.start_time).toLocaleTimeString() : 'TBD',
            maxParticipants: e.max_participants ?? 0,
            currentParticipants: e.current_participants ?? 0,
            category: e.category ?? 'General',
            isOnline: e.is_online ?? false,
            tokenCost: e.token_cost ?? 0,
            features: e.accessibility_features ?? [],
            rating: e.rating ?? 0,
            totalRatings: e.total_ratings ?? 0,
          })));
        }
      } catch (err) {
        console.error('Error fetching women events:', err);
      }
    }

    // Fetch real women coaches from Supabase
    async function fetchCoaches() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'coach')
          .eq('gender', 'female')
          .order('followers', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          setCoaches(data.map((c: any) => ({
            id: c.id,
            name: c.full_name ?? c.username ?? 'Unknown',
            profileImage: c.profile_image ?? c.avatar_url,
            bio: c.bio ?? '',
            specialty: c.sports_category ?? 'General',
            rating: c.rating ?? 0,
            totalRatings: c.total_ratings ?? 0,
            followers: c.followers ?? 0,
            isVerified: c.is_verified ?? false,
            isOnline: false,
          })));
        }
      } catch (err) {
        console.error('Error fetching women coaches:', err);
      }
    }

    // Fetch real women's content from Supabase (posts by female users)
    async function fetchContent() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            author:profiles!author_id(
              id, full_name, profile_image, avatar_url, gender
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          const womenContent = data
            .filter((p: any) => p.author?.gender === 'female')
            .map((p: any) => ({
              id: p.id,
              title: p.content?.substring(0, 50) ?? 'Post',
              description: p.content ?? '',
              type: p.media_urls?.[0] ? 'video' as const : 'article' as const,
              thumbnail: p.media_urls?.[0],
              author: {
                name: p.author?.full_name ?? 'Unknown',
                profileImage: p.author?.profile_image ?? p.author?.avatar_url,
              },
              views: p.views ?? 0,
              likes: p.likes_count ?? 0,
              category: 'General',
              isPremium: false,
              tokenCost: 0,
            }));
          if (womenContent.length > 0) {
            setContent(womenContent);
          }
        }
      } catch (err) {
        console.error('Error fetching women content:', err);
      }
    }

    fetchEvents();
    fetchCoaches();
    fetchContent();
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
        <div className={`rounded-lg p-8 text-center ${darkMode ? 'bg-gradient-to-r from-pink-900/30 to-purple-900/30' : 'bg-gradient-to-r from-pink-50 to-purple-50'}`}>
          <Shield className="h-16 w-16 text-pink-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Women's Lounge</h2>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            This space is exclusively for women athletes and organizers. It provides a safe, supportive environment
            for women to connect, learn, and grow together in sports.
          </p>
          <div className={`rounded-lg p-6 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Why Women's Lounge?</h3>
            <ul className={`text-left space-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
    <div className={`max-w-6xl mx-auto p-6 ${darkMode ? 'bg-gray-900 min-h-screen' : ''}`}>
      {/* Header */}
      <div className={`rounded-lg p-6 mb-8 ${darkMode ? 'bg-gradient-to-r from-pink-900/30 to-purple-900/30' : 'bg-gradient-to-r from-pink-50 to-purple-50'}`}>
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${darkMode ? 'bg-pink-900/50' : 'bg-pink-100'}`}>
            <Heart className={`h-8 w-8 ${darkMode ? 'text-pink-400' : 'text-pink-600'}`} />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Women's Lounge</h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>A safe space for women athletes to connect, learn, and grow together</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`flex space-x-1 rounded-lg p-1 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {[
          { id: 'events', label: 'Events', icon: Calendar },
          { id: 'coaches', label: 'Coaches', icon: Users },
          { id: 'content', label: 'Content', icon: BookOpen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === tab.id
                ? (darkMode ? 'bg-gray-700 text-pink-400 shadow-sm' : 'bg-white text-pink-600 shadow-sm')
                : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900')
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
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Upcoming Events</h2>
          <div className="grid gap-6">
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{event.title}</h3>
                    <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{event.description}</p>

                    <div className={`flex items-center space-x-4 text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
                          className={`px-3 py-1 text-xs rounded-full ${darkMode ? 'bg-pink-900/30 text-pink-300' : 'bg-pink-100 text-pink-700'}`}
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
                      <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>({event.totalRatings})</span>
                    </div>
                    <div className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {event.currentParticipants}/{event.maxParticipants} participants
                    </div>
                    <div className={`text-lg font-bold mb-3 ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>
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
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Featured Women Coaches</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {coaches.map((coach) => (
              <motion.div
                key={coach.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img
                      src={coach.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={coach.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    {coach.isOnline && (
                      <div className={`absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 ${darkMode ? 'border-gray-800' : 'border-white'}`}></div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{coach.name}</h3>
                      {coach.isVerified && (
                        <Shield className="h-4 w-4 text-blue-500" />
                      )}
                    </div>

                    <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{coach.bio}</p>

                    <div className={`flex items-center space-x-4 text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Women's Content</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
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
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</p>

                  <div className={`flex items-center space-x-4 text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      by {item.author.name}
                    </div>
                    <Button
                      onClick={() => handleAccessContent(item)}
                      size="sm"
                      variant={item.isPremium ? "primary" : "outline"}
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
