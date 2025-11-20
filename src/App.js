
import './App.css';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, BookOpen, Wand2, Copy, Share2, Save, RefreshCw, Check, Download, MessageSquare } from 'lucide-react';

const StorySphere = () => {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [storyLength, setStoryLength] = useState(2);
  const [creativity, setCreativity] = useState(0.7);
  const [tone, setTone] = useState('dramatic');
  const [currentStory, setCurrentStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [stats, setStats] = useState({
    storiesGenerated: 0,
    totalWords: 0,
    genreCounts: {}
  });
  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const storyOutputRef = useRef(null);

  const genres = [
    { id: 'sci-fi', icon: '🚀', label: 'Sci-Fi' },
    { id: 'fantasy', icon: '🐉', label: 'Fantasy' },
    { id: 'mystery', icon: '🔍', label: 'Mystery' },
    { id: 'romance', icon: '💕', label: 'Romance' },
    { id: 'horror', icon: '👻', label: 'Horror' },
    { id: 'adventure', icon: '⚔️', label: 'Adventure' }
  ];

  const lengthLabels = ['Short', 'Medium', 'Long'];
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const toggleGenre = (genreId) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(g => g !== genreId)
        : [...prev, genreId]
    );
  };

  const generateStoryWithAI = async () => {
    if (selectedGenres.length === 0) {
      showToast('Please select at least one genre!', 'error');
      return;
    }

    setIsGenerating(true);
    setShowActions(false);
    setCurrentStory('');

    const lengthMap = {
      1: { words: 150, tokens: 300 },
      2: { words: 300, tokens: 500 },
      3: { words: 500, tokens: 800 }
    };

    const selectedLength = lengthMap[storyLength];
    const genreNames = selectedGenres.map(g => genres.find(genre => genre.id === g)?.label).join(', ');

    const systemPrompt = `You are a master storyteller. Create an engaging, original ${tone} story of approximately ${selectedLength.words} words that seamlessly blends elements from these genres: ${genreNames}. 

Requirements:
- Make it vivid and immersive with strong imagery
- Include compelling characters and conflict
- Use creative plot twists and unexpected elements
- Match the ${tone} tone throughout
- Make it feel complete despite its length
- Avoid clichés and predictable storylines`;

    const userPrompt = `Write a captivating ${lengthLabels[storyLength - 1].toLowerCase()} story combining ${genreNames}. Be creative and original!`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: selectedLength.tokens,
          temperature: creativity,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const story = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n\n');

      if (story) {
        setCurrentStory(story);
        
        // Update stats
        const wordCount = story.split(/\s+/).length;
        setStats(prev => {
          const newGenreCounts = { ...prev.genreCounts };
          selectedGenres.forEach(genre => {
            newGenreCounts[genre] = (newGenreCounts[genre] || 0) + 1;
          });

          return {
            storiesGenerated: prev.storiesGenerated + 1,
            totalWords: prev.totalWords + wordCount,
            genreCounts: newGenreCounts
          };
        });

        setShowActions(true);
        showToast('Story generated successfully! ✨', 'success');
        
        // Scroll to story
        setTimeout(() => {
          storyOutputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      } else {
        throw new Error('No story generated');
      }
    } catch (error) {
      console.error('Generation error:', error);
      showToast('Failed to generate story. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentStory);
      setCopied(true);
      showToast('Story copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy story', 'error');
    }
  };

  const downloadStory = () => {
    const blob = new Blob([currentStory], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storysphere-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Story downloaded!', 'success');
  };

  const shareStory = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'StorySphere Story',
          text: currentStory
        });
        showToast('Story shared!', 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const favoriteGenre = Object.entries(stats.genreCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || '-';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 2 + 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/95 backdrop-blur-lg shadow-2xl' : 'bg-black/50 backdrop-blur-sm'
      }`}>
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={28} />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              StorySphere
            </span>
          </div>
          <div className="hidden md:flex gap-8">
            {['Home', 'Features', 'Demo', 'Stats'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="hover:text-purple-400 transition-colors relative group"
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-4xl text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
            StorySphere
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            Unleash infinite narratives with AI-powered storytelling across countless universes
          </p>
          <button
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-lg font-semibold overflow-hidden transition-transform hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Wand2 size={20} />
              Start Creating Stories
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🌌', title: 'Multiverse Exploration', desc: 'Generate stories across infinite parallel universes with unique settings' },
              { icon: '🤖', title: 'Real AI Power', desc: 'Powered by Claude AI for truly creative and unique narratives' },
              { icon: '🎭', title: 'Dynamic Characters', desc: 'Complex characters that grow throughout your story' },
              { icon: '🎨', title: 'Genre Fusion', desc: 'Blend multiple genres seamlessly for unique tales' },
              { icon: '📚', title: 'Smart Generation', desc: 'Customizable length, creativity, and tone controls' },
              { icon: '⚡', title: 'Instant Results', desc: 'Generate captivating stories in seconds' }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3 text-purple-300">{feature.title}</h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-6 bg-black/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Story Generator
          </h2>
          <p className="text-center text-gray-400 mb-12 text-lg">
            Configure your story parameters and let our AI craft a unique tale
          </p>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
            {/* Settings Panel */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl p-6 border border-purple-400/30">
                <label className="block text-purple-300 font-bold mb-3">
                  Story Length
                  <span className="float-right text-pink-400">{lengthLabels[storyLength - 1]}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={storyLength}
                  onChange={(e) => setStoryLength(Number(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, rgb(147 51 234 / 0.6) 0%, rgb(147 51 234 / 0.6) ${((storyLength - 1) / 2) * 100}%, rgb(255 255 255 / 0.2) ${((storyLength - 1) / 2) * 100}%, rgb(255 255 255 / 0.2) 100%)`
                  }}
                />
                <style>{`
                  .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #a855f7, #ec4899);
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
                  }
                  .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #a855f7, #ec4899);
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
                  }
                `}</style>
              </div>

              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl p-6 border border-purple-400/30">
                <label className="block text-purple-300 font-bold mb-3">
                  Creativity
                  <span className="float-right text-pink-400">{creativity.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={creativity}
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, rgb(147 51 234 / 0.6) 0%, rgb(147 51 234 / 0.6) ${creativity * 100}%, rgb(255 255 255 / 0.2) ${creativity * 100}%, rgb(255 255 255 / 0.2) 100%)`
                  }}
                />
              </div>

              <div className="bg-black/30 rounded-xl p-6">
                <label className="block text-purple-300 font-bold mb-3">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600/80 to-pink-600/80 border border-purple-400/50 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50"
                  style={{
                    backgroundImage: 'linear-gradient(to right, rgba(147, 51, 234, 0.8), rgba(219, 39, 119, 0.8))'
                  }}
                >
                  <option value="dramatic" style={{ background: '#1f2937', color: 'white' }}>Dramatic</option>
                  <option value="lighthearted" style={{ background: '#1f2937', color: 'white' }}>Lighthearted</option>
                  <option value="dark" style={{ background: '#1f2937', color: 'white' }}>Dark</option>
                  <option value="inspirational" style={{ background: '#1f2937', color: 'white' }}>Inspirational</option>
                  <option value="suspenseful" style={{ background: '#1f2937', color: 'white' }}>Suspenseful</option>
                </select>
              </div>
            </div>

            {/* Genre Selection */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-center text-purple-300">Select Genres</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {genres.map(genre => (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                      selectedGenres.includes(genre.id)
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 scale-105 shadow-lg shadow-purple-500/50'
                        : 'bg-white/10 hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    <span className="mr-2">{genre.icon}</span>
                    {genre.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateStoryWithAI}
              disabled={isGenerating || selectedGenres.length === 0}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Generate Story
                </>
              )}
            </button>

            {/* Story Output */}
            <div
              ref={storyOutputRef}
              className={`mt-8 bg-black/30 rounded-xl p-6 min-h-[200px] border border-white/10 ${
                isGenerating ? 'animate-pulse' : ''
              }`}
            >
              {currentStory ? (
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{currentStory}</p>
                </div>
              ) : (
                <p className="text-center text-gray-500 italic flex items-center justify-center gap-2 h-full">
                  <BookOpen size={20} />
                  Your AI-generated story will appear here...
                </p>
              )}
            </div>

            {/* Story Actions */}
            {showActions && (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={shareStory}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20"
                >
                  <Share2 size={18} />
                  Share
                </button>
                <button
                  onClick={downloadStory}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20"
                >
                  <Download size={18} />
                  Download
                </button>
                <button
                  onClick={generateStoryWithAI}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg rounded-xl transition-all"
                >
                  <RefreshCw size={18} />
                  Regenerate
                </button>
              </div>
            )}

            {/* Stats Panel */}
            <div id="stats" className="grid grid-cols-3 gap-4 mt-8">
              {[
                { label: 'Stories', value: stats.storiesGenerated },
                { label: 'Words', value: stats.totalWords.toLocaleString() },
                { label: 'Top Genre', value: favoriteGenre === '-' ? '-' : genres.find(g => g.id === favoriteGenre)?.label || '-' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 text-center border border-purple-400/30">
                  <div className="text-3xl font-bold text-purple-300">{stat.value}</div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-black/50 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            StorySphere
          </h3>
          <p className="text-gray-400 mb-6">Crafting infinite stories across the multiverse with AI</p>
          <div className="flex justify-center gap-6 text-2xl mb-6">
            {['📘', '🐦', '🎨', '📺'].map((icon, idx) => (
              <a
                key={idx}
                href="#"
                className="hover:text-purple-400 transition-colors hover:-translate-y-1 inline-block"
              >
                {icon}
              </a>
            ))}
          </div>
          <p className="text-gray-500 text-sm">© 2024 StorySphere. Powered by Claude AI.</p>
        </div>
      </footer>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl transform transition-transform duration-300 z-50 flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-red-600' :
          toast.type === 'success' ? 'bg-green-600' :
          'bg-gradient-to-r from-purple-600 to-pink-600'
        }`}>
          <MessageSquare size={20} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default StorySphere;