import React from 'react';
import { motion } from 'framer-motion';
import { Play, Users, Clock, Radio } from 'lucide-react';
import { User } from '../../types';

interface Livestream {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  coach: User;
  isLive: boolean;
  scheduledTime?: string;
  viewers?: number;
  category: 'coco' | 'martial-arts' | 'calorie-fight';
}

interface LivestreamCardProps {
  livestream: Livestream;
}

export function LivestreamCard({ livestream }: LivestreamCardProps) {
  const getYoutubeEmbedUrl = (url: string) => {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'coco':
        return 'bg-orange-100 text-orange-800';
      case 'martial-arts':
        return 'bg-red-100 text-red-800';
      case 'calorie-fight':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      {/* Video Embed */}
      <div className="relative aspect-video bg-gray-900">
        {livestream.isLive ? (
          <iframe
            src={getYoutubeEmbedUrl(livestream.youtubeUrl)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center">
              <Play className="h-16 w-16 text-white mx-auto mb-4 opacity-50" />
              <p className="text-white text-lg font-semibold">Stream Scheduled</p>
            </div>
          </div>
        )}

        {/* Live Badge */}
        {livestream.isLive && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
            <Radio className="h-4 w-4" />
            <span>LIVE</span>
          </div>
        )}

        {/* Viewers Count */}
        {livestream.isLive && livestream.viewers && (
          <div className="absolute top-4 right-4 flex items-center space-x-1 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
            <Users className="h-4 w-4" />
            <span>{livestream.viewers.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <img
            src={livestream.coach.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
            alt={livestream.coach.fullName}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-1">
              <p className="font-semibold text-gray-900">{livestream.coach.fullName}</p>
              {livestream.coach.isVerified && (
                <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(livestream.category)}`}>
              {livestream.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {livestream.title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {livestream.description}
        </p>

        {/* Scheduled Time */}
        {!livestream.isLive && livestream.scheduledTime && (
          <div className="flex items-center text-sm text-gray-500 bg-gray-50 p-2 rounded">
            <Clock className="h-4 w-4 mr-2" />
            <span>Scheduled: {new Date(livestream.scheduledTime).toLocaleString()}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
