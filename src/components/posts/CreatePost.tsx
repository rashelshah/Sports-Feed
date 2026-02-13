import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image, Video, Send, Mic, Square, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { aiService } from '../../services/aiService';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface CreatePostProps {
  onPostCreated: (post: any) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user, darkMode } = useAuthStore();
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Only show create post for coaches
  if (user?.role !== 'coach') return null;

  // Play a short beep to indicate recording start/stop
  const playRecordingBeep = (frequency: number = 880, duration: number = 150) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) {
      // Audio feedback is non-critical, fail silently
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      playRecordingBeep(880, 150); // High-pitch beep for start
      toast.success('Recording started');
    } catch (error) {
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      playRecordingBeep(440, 200); // Lower-pitch beep for stop
      toast.success('Recording stopped');
    }
  };

  // Helper: upload a single file to Cloudinary via the backend
  const uploadFile = async (file: File | Blob, folder: string): Promise<{ url: string; type: string } | null> => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const formData = new FormData();
    if (file instanceof Blob && !(file instanceof File)) {
      // Convert blob to File with a name
      const audioFile = new File([file], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
      formData.append('file', audioFile);
    } else {
      formData.append('file', file);
    }
    formData.append('folder', folder);

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/upload/single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    return { url: data.file.url, type: data.file.type };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && !mediaFile && !audioBlob) {
      toast.error('Please add some content, media, or voice note');
      return;
    }

    setIsPosting(true);

    try {
      // AI Content Filtering & Abuse Detection
      if (content.trim()) {
        setUploadStatus('Checking content...');
        const [filterResult, abuseResult] = await Promise.all([
          aiService.filterMultilingualContent(content, 'post'),
          aiService.detectAbuse(content, 'text')
        ]);

        if (abuseResult.isAbusive) {
          if (abuseResult.severity === 'critical' || abuseResult.severity === 'high') {
            toast.error('Post contains inappropriate content. Please revise.');
            setIsPosting(false);
            setUploadStatus('');
            return;
          }
          toast.error('Post may contain questionable content. Please review.');
        }

        if (!filterResult.isSafe) {
          toast.error(filterResult.reason || 'Content needs moderation');
          setIsPosting(false);
          setUploadStatus('');
          return;
        }
      }

      // Upload media files to Cloudinary
      const mediaUrls: string[] = [];
      let detectedMediaType: 'image' | 'video' | 'audio' | undefined;
      let audioUrl: string | undefined;

      // Upload photo/video if selected
      if (mediaFile) {
        setUploadStatus('Uploading media...');
        try {
          const result = await uploadFile(mediaFile, 'posts');
          if (result) {
            mediaUrls.push(result.url);
            detectedMediaType = result.type as 'image' | 'video';
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to upload media');
          setIsPosting(false);
          setUploadStatus('');
          return;
        }
      }

      // Upload audio blob if recorded
      if (audioBlob) {
        setUploadStatus('Uploading voice note...');
        try {
          const result = await uploadFile(audioBlob, 'voice-notes');
          if (result) {
            audioUrl = result.url;
            if (!mediaFile) {
              mediaUrls.push(result.url);
              detectedMediaType = 'audio';
            } else {
              mediaUrls.push(result.url);
            }
          }
        } catch (error: any) {
          toast.error(error.message || 'Failed to upload voice note');
          setIsPosting(false);
          setUploadStatus('');
          return;
        }
      }

      // Transcribe audio if present
      let transcribedText = '';
      if (audioBlob) {
        setUploadStatus('Transcribing voice note...');
        try {
          const transcription = await aiService.transcribeAudio(audioBlob);
          transcribedText = transcription.text;
          if (transcribedText) {
            toast.success('Voice note transcribed!');
          }
        } catch (error) {
          console.error('Transcription failed:', error);
        }
      }

      // Create post via backend API
      setUploadStatus('Creating post...');
      const finalContent = audioBlob && transcribedText ? `${content}\n\n[Voice: ${transcribedText}]` : content;

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to post');
        setIsPosting(false);
        setUploadStatus('');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: finalContent,
          mediaUrls
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create post');
      }

      // Map backend post to frontend Post type
      const p = data.post;
      const mappedPost = {
        id: p.id,
        userId: p.author_id,
        user: {
          id: p.author?.id || p.author_id,
          username: p.author?.username || p.author?.full_name || 'Unknown',
          fullName: p.author?.full_name || p.author?.name || 'Unknown',
          email: p.author?.email || '',
          profileImage: p.author?.profile_image || p.author?.avatar_url || null,
          sportsCategory: p.author?.sports_category || 'unstructured-sports',
          gender: 'prefer-not-to-say' as const,
          role: p.author?.role || 'coach',
          isVerified: p.author?.is_verified || false,
          bio: '',
          followers: 0,
          following: 0,
          posts: 0,
          createdAt: p.created_at
        },
        content: p.content,
        mediaUrl: mediaUrls.length > 0 ? mediaUrls[0] : null,
        mediaType: detectedMediaType || undefined,
        audioUrl: audioUrl || undefined,
        likes: p.likes_count || 0,
        shares: p.shares_count || 0,
        comments: p.comments_count || 0,
        isLiked: false,
        createdAt: p.created_at
      };

      onPostCreated(mappedPost);

      // Reset form
      setContent('');
      setMediaFile(null);
      setMediaPreviewUrl(null);
      setAudioBlob(null);
      setUploadStatus('');
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setIsPosting(false);
      setUploadStatus('');
    }
  };

  const handleFileSelect = (file: File) => {
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setMediaFile(file);

    // Create preview URL for images and videos
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(previewUrl);
    toast.success('Media file selected');
  };

  const clearMediaFile = () => {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaFile(null);
    setMediaPreviewUrl(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg shadow-md p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-4">
          <img
            src={user?.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'}
            alt={user?.fullName}
            className="h-12 w-12 rounded-full object-cover"
          />

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your training tips, techniques, or motivation..."
              className={`w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white'}`}
              rows={4}
            />

            {/* Media Preview */}
            {mediaFile && mediaPreviewUrl && (
              <div className={`mt-3 rounded-lg overflow-hidden border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                {mediaFile.type.startsWith('image/') ? (
                  <div className="relative">
                    <img
                      src={mediaPreviewUrl}
                      alt="Preview"
                      className="w-full max-h-64 object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearMediaFile}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : mediaFile.type.startsWith('video/') ? (
                  <div className="relative">
                    <video
                      src={mediaPreviewUrl}
                      className="w-full max-h-64 object-cover"
                      controls
                      muted
                    />
                    <button
                      type="button"
                      onClick={clearMediaFile}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{mediaFile.name}</span>
                      <button
                        type="button"
                        onClick={clearMediaFile}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audio Recording Indicator */}
            {audioBlob && (
              <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mic className={`h-4 w-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Voice note recorded</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudioBlob(null)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* Upload Status */}
            {isPosting && uploadStatus && (
              <div className={`mt-3 p-3 rounded-lg flex items-center space-x-2 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <Loader2 className={`h-4 w-4 animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{uploadStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    e.target.value = '';
                  }}
                />
                <label
                  htmlFor="image-upload"
                  className={`flex items-center space-x-2 cursor-pointer transition-colors ${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-500'}`}
                >
                  <Image className="h-5 w-5" />
                  <span className="text-sm">Photo</span>
                </label>

                <input
                  type="file"
                  id="video-upload"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    e.target.value = '';
                  }}
                />
                <label
                  htmlFor="video-upload"
                  className={`flex items-center space-x-2 cursor-pointer transition-colors ${darkMode ? 'text-gray-400 hover:text-purple-400' : 'text-gray-500 hover:text-purple-500'}`}
                >
                  <Video className="h-5 w-5" />
                  <span className="text-sm">Video</span>
                </label>

                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center space-x-2 cursor-pointer transition-colors ${isRecording
                    ? 'text-red-500 hover:text-red-700'
                    : (darkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-500')
                    }`}
                >
                  {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  <span className="text-sm">{isRecording ? 'Stop' : 'Voice'}</span>
                </button>
              </div>

              <Button
                type="submit"
                loading={isPosting}
                disabled={!content.trim() && !mediaFile && !audioBlob}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}