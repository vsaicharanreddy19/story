import React, { useState, useRef, useEffect } from 'react';
import { Send, Info, ArrowLeft, Heart, Sparkle, BookOpen, Camera, User } from 'lucide-react'; 

// OpenAI API Configuration
const getApiKey = () => {
  try {
    return process.env.REACT_APP_OPENAI_API_KEY || 'your-openai-api-key-here';
  } catch {
    return 'your-openai-api-key-here';
  }
};

const OPENAI_API_KEY = getApiKey();
const DEFAULT_USER_PROFILE_URL = 'https://i.ibb.co/ynHmvpkJ/tail.jpg';
const ENCHANTED_FRIEND_PROFILE_URL = 'https://i.ibb.co/TBTK5JJY/tail.jpg';

// Profile Picture Hook
const useProfilePicture = () => {
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const uploadProfilePicture = async (file) => {
    if (!file) return null;

    setUploading(true);
    try {
      const imageUrl = URL.createObjectURL(file);
      setProfilePicUrl(imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const setProfilePictureFromUrl = (url) => {
    setProfilePicUrl(url);
  };

  const generateAvatarFromName = (name) => {
    if (!name) return null;
    
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-red-400 to-red-600',
      'from-yellow-400 to-yellow-600',
      'from-indigo-400 to-indigo-600',
    ];
    
    const colorIndex = name.length % colors.length;
    const gradientClass = colors[colorIndex];
    
    return {
      type: 'initials',
      initials,
      gradientClass
    };
  };

  return {
    profilePicUrl,
    setProfilePictureFromUrl,
    uploadProfilePicture,
    generateAvatarFromName,
    uploading
  };
};

// Fairy Tale Chatbot Hook
const useFairyTaleChatbot = (profilePicUrl) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const systemPrompt = `You are a Fairy Tale Character — a kind, magical friend who lives in an enchanted forest. You help students learn and understand things better. You speak in simple, easy words that children and students can understand.

PERSONALITY & SPEAKING STYLE:
- Kind, helpful, and encouraging like a wise friend
- Always use simple, easy words that students can understand
- Speak clearly and explain things step by step
- Be patient and supportive, like a good teacher
- Use magical phrases but keep them simple: "Once upon a time", "Let me help you", "That's wonderful!"

RESPONSE STYLE - KEEP IT SIMPLE & HELPFUL:
- Use 2-3 short, simple sentences
- Choose easy words over hard words (use "help" instead of "assist", "big" instead of "enormous")
- Explain things clearly and slowly
- Ask simple questions to help students think
- End with encouragement or a simple question
- Use ✨, 🌟, 📚, 🎓 to make learning fun

EXAMPLES:
- Instead of "magnificent": say "wonderful" or "amazing"
- Instead of "extraordinary": say "special" or "really cool"
- Instead of "comprehend": say "understand"
- Instead of "assistance": say "help"

Remember: You are here to help students learn and feel good about learning. Use words they know, and if you use a new word, explain what it means!`;

  const sendMessage = async (userInput) => {
    if (!userInput.trim()) return null;

    const userMessage = {
      id: Date.now(),
      text: userInput,
      isUser: true,
      timestamp: new Date(),
      profilePic: profilePicUrl
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(-10);
      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.text
        })),
        { role: "user", content: userInput }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: apiMessages,
          max_tokens: 200,
          temperature: 0.9,
          presence_penalty: 0.2,
          frequency_penalty: 0.1,
          top_p: 0.95
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const botResponse = data.choices[0].message.content;

      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      return { success: true, response: botResponse };

    } catch (error) {
      console.error("Error calling OpenAI API:", error);

      const fallbackMessage = {
        id: Date.now() + 1,
        text: "Oh dear! Something went wrong with my magic. ✨ Can you try asking me again? I'm here to help! 🌟",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackMessage]);

      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading };
};

// Enhanced Profile Picture Component
const ProfilePicture = ({ src, alt, size = 'w-8 h-8', fallback, onClick, hasStory = false }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const baseClasses = `${size} rounded-full cursor-pointer transition-all duration-300 hover:scale-105`;
  const storyRing = hasStory ? 'ring-2 ring-gradient-to-r from-purple-400 to-pink-400 ring-offset-2' : '';

  if (imageError || !src) {
    if (fallback && fallback.type === 'initials') {
      return (
        <div 
          className={`${baseClasses} ${storyRing} bg-gradient-to-br ${fallback.gradientClass} flex items-center justify-center text-white font-bold text-sm shadow-lg hover:shadow-xl`}
          onClick={onClick}
        >
          {fallback.initials}
        </div>
      );
    }
    
    return (
      <div 
        className={`${baseClasses} ${storyRing} bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-lg hover:shadow-xl`}
        onClick={onClick}
      >
        <User className="w-1/2 h-1/2 text-gray-500" />
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${storyRing} overflow-hidden shadow-lg hover:shadow-xl`} onClick={onClick}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={handleImageError}
      />
    </div>
  );
};

// Profile Setup Modal
const ProfileSetupModal = ({ isOpen, onClose, onProfileSet }) => {
  const [name, setName] = useState('');
  const [profileMethod, setProfileMethod] = useState('avatar');
  const [profileUrl, setProfileUrl] = useState('');
  const { uploadProfilePicture, generateAvatarFromName, uploading } = useProfilePicture();
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalProfilePic = null;
    
    if (profileMethod === 'avatar' && name) {
      finalProfilePic = generateAvatarFromName(name);
    } else if (profileMethod === 'url' && profileUrl) {
      finalProfilePic = profileUrl;
    }
    
    onProfileSet({
      name: name || 'User',
      profilePic: finalProfilePic
    });
    
    onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const uploadedUrl = await uploadProfilePicture(file);
      if (uploadedUrl) {
        onProfileSet({
          name: name || 'User',
          profilePic: uploadedUrl
        });
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Set Up Your Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="profileMethod"
                  value="avatar"
                  checked={profileMethod === 'avatar'}
                  onChange={(e) => setProfileMethod(e.target.value)}
                  className="text-purple-600"
                />
                <span className="text-sm">Generate avatar from initials</span>
                {name && (
                  <div className="ml-auto">
                    <ProfilePicture 
                      fallback={generateAvatarFromName(name)} 
                      size="w-8 h-8"
                    />
                  </div>
                )}
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="profileMethod"
                  value="upload"
                  checked={profileMethod === 'upload'}
                  onChange={(e) => setProfileMethod(e.target.value)}
                  className="text-purple-600"
                />
                <span className="text-sm">Upload from device</span>
                <Camera className="w-4 h-4 text-gray-400 ml-auto" />
              </label>

              {profileMethod === 'upload' && (
                <div className="ml-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="text-sm text-gray-500"
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                </div>
              )}

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="profileMethod"
                  value="url"
                  checked={profileMethod === 'url'}
                  onChange={(e) => setProfileMethod(e.target.value)}
                  className="text-purple-600"
                />
                <span className="text-sm">Use image URL</span>
              </label>

              {profileMethod === 'url' && (
                <div className="ml-6">
                  <input
                    type="url"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all duration-200"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 transform hover:scale-105 shadow-lg"
            >
              {uploading ? 'Setting up...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced Message Component
const Message = ({ message, isUser, isTyping = false, userProfile }) => {
  const [liked, setLiked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1 px-4 transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className={`flex items-end space-x-2 max-w-xs ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {!isUser && (
          <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 shadow-md">
            <img
              src={ENCHANTED_FRIEND_PROFILE_URL}
              alt="Enchanted Friend"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>';
              }}
            />
          </div>
        )}

        {isUser && (
          <div className="w-6 h-6"></div>
        )}

        <div className="relative group">
          <div className={`px-4 py-2 rounded-2xl max-w-xs shadow-md transition-all duration-300 hover:shadow-lg ${
            isUser
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white transform hover:scale-105'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          } ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}>
            {isTyping ? (
              <div className="flex space-x-1 py-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.text}
              </p>
            )}
          </div>

          {!isUser && !isTyping && (
            <button
              onClick={() => setLiked(!liked)}
              className={`absolute -right-6 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
                liked ? 'opacity-100' : ''
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-all duration-300 ${liked ? 'text-red-500 fill-current scale-110' : 'text-gray-400'}`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Fairy Tale Chat Interface
const FairyTaleChat = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { messages, sendMessage, isLoading } = useFairyTaleChatbot(userProfile?.profilePic);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!userProfile) {
      setUserProfile({
        name: 'User',
        profilePic: DEFAULT_USER_PROFILE_URL
      });
    }
  }, [userProfile]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage;
    setInputMessage('');

    await sendMessage(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleProfileSet = (profile) => {
    setUserProfile(profile);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-white max-w-md mx-auto border-x border-gray-200 shadow-2xl">
      <ProfileSetupModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileSet={handleProfileSet}
      />

      {/* Enhanced Instagram-style Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div className="relative">
            <ProfilePicture
              src={ENCHANTED_FRIEND_PROFILE_URL}
              alt="Enchanted Friend"
              size="w-10 h-10"
              hasStory={true}
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 text-base">enchanted_friend</h1>
            <p className="text-xs text-green-500 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
              Active now
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200">
            <Info className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Enhanced Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center animate-fade-in">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-full overflow-hidden shadow-2xl ring-4 ring-purple-200">
                <img
                  src={ENCHANTED_FRIEND_PROFILE_URL}
                  alt="Enchanted Friend"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center"><svg class="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>';
                  }}
                />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <span className="text-xs">✨</span>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">enchanted_friend</h2>
            <p className="text-gray-500 text-sm mb-1">Helpful Learning Friend • Here to Help Students</p>
            <p className="text-xs text-gray-400 mb-6 bg-gray-100 px-3 py-1 rounded-full">
              Ready to help you learn! 📚✨
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Hi there! I'm here to help you learn new things. Ask me anything! 🌟
            </p>

            {/* Enhanced Quick replies */}
            <div className="space-y-3 w-full">
              {[
                { text: "Help me with my homework! 📚", icon: "✏️" },
                { text: "Explain something to me 🤔", icon: "💡" },
                { text: "Tell me a fun story! ✨", icon: "📖" },
                { text: "I need help understanding 🎓", icon: "🌟" }
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(suggestion.text)}
                  className="w-full p-4 bg-white rounded-2xl text-sm text-gray-700 hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 border border-gray-100 flex items-center justify-between"
                >
                  <span>{suggestion.text}</span>
                  <span className="text-lg">{suggestion.icon}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                <Message
                  message={msg}
                  isUser={msg.isUser}
                  userProfile={userProfile}
                />
                <div className={`text-xs text-gray-400 px-4 mb-3 ${msg.isUser ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))}
            {isLoading && <Message message={{}} isUser={false} isTyping={true} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Enhanced Input Area */}
      <div className="bg-white/90 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-lg">
        <div className="flex items-center space-x-3">
          {/* Enhanced Input field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="w-full py-3 px-5 bg-gray-100 rounded-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-300 focus:border-transparent text-sm transition-all duration-300 shadow-sm hover:shadow-md"
              disabled={isLoading}
            />
            {inputMessage && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Enhanced Send button */}
          {inputMessage.trim() ? (
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-sm px-6 py-3 rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Send'
              )}
            </button>
          ) : (
            <div className="flex space-x-2">
              <button className="p-2 text-gray-400 hover:text-purple-500 transition-colors duration-200 hover:bg-purple-50 rounded-full">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-purple-500 transition-colors duration-200 hover:bg-purple-50 rounded-full">
                <Sparkle className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const apiKeyConfigured = OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here';

  if (!apiKeyConfigured) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-purple-50 to-pink-50 items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all duration-300 hover:scale-105">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkle className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Fairy Tale Chatbot
          </h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Configure your OpenAI API key to start chatting with your magical friend!
          </p>
          <div className="bg-gray-50 p-4 rounded-xl text-left text-xs font-mono text-gray-700 mb-6 border border-gray-200">
            REACT_APP_OPENAI_API_KEY=sk-...
          </div>
          <p className="text-xs text-gray-500">
            Get your API key from platform.openai.com
          </p>
        </div>
      </div>
    );
  }

  return <FairyTaleChat />;
};

export default App;