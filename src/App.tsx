/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  MessageSquare, 
  Send, 
  LayoutDashboard, 
  ChevronRight, 
  GraduationCap,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { CURRICULUM } from './curriculum';
import { Topic, UserProgress, ChatMessage } from './types';
import { askQuestion, getNextStepSuggestions, summarizeChat } from './services/gemini';

export default function App() {
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(CURRICULUM[0].id);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [view, setView] = useState<'learning' | 'dashboard'>('learning');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [topicQuestionCounts, setTopicQuestionCounts] = useState<Record<string, number>>({});

  const MAX_DISPLAY_MESSAGES = 20;
  const QUESTIONS_FOR_COMPLETION = 5;

  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentTopic = CURRICULUM.find(t => t.id === currentTopicId) || CURRICULUM[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const nextSteps = await getNextStepSuggestions(completedTopics, currentTopicId);
      setSuggestions(nextSteps);
    };
    fetchSuggestions();
  }, [completedTopics, currentTopicId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg, timestamp: new Date() }]);
    setQuestionsAsked(prev => [...new Set([...prev, userMsg])]);
    setIsTyping(true);

    // Update question count for current topic
    if (currentTopicId) {
      setTopicQuestionCounts(prev => {
        const newCount = (prev[currentTopicId] || 0) + 1;
        
        // Auto-complete if threshold reached
        if (newCount === QUESTIONS_FOR_COMPLETION && !completedTopics.includes(currentTopicId)) {
          toggleComplete(currentTopicId);
        }
        
        return { ...prev, [currentTopicId]: newCount };
      });
    }

    try {
      const history = chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      const response = await askQuestion(userMsg, history);
      setChatHistory(prev => [...prev, { role: 'model', text: response || "I'm sorry, I couldn't process that.", timestamp: new Date() }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory(prev => [...prev, { role: 'model', text: "An error occurred. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSummarize = async () => {
    if (chatHistory.length === 0 || isTyping) return;
    setIsTyping(true);

    try {
      const history = chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      const summary = await summarizeChat(history);
      setChatHistory(prev => [...prev, { 
        role: 'model', 
        text: `📊 **Learning Summary:**\n\n${summary}`, 
        timestamp: new Date() 
      }]);
    } catch (error) {
      console.error("Summary error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleComplete = async (id: string) => {
    const isNowComplete = !completedTopics.includes(id);
    setCompletedTopics(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );

    if (isNowComplete && chatHistory.length > 0) {
      // Automatically suggest a summary when a topic is completed
      handleSummarize();
    }
  };

  const progressPercentage = Math.round((completedTopics.length / CURRICULUM.length) * 100);

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-[#E5E7EB] flex flex-col">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center gap-3">
          <div className="bg-[#4F46E5] p-2 rounded-lg">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">LearnAI</h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-[#4F46E5] text-white shadow-md' : 'hover:bg-[#F3F4F6] text-[#4B5563]'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>

          <div className="pt-4 pb-2 px-4">
            <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Curriculum</span>
          </div>

          {CURRICULUM.map((topic) => (
            <button
              key={topic.id}
              onClick={() => {
                setCurrentTopicId(topic.id);
                setView('learning');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${currentTopicId === topic.id && view === 'learning' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'hover:bg-[#F3F4F6] text-[#4B5563]'}`}
            >
              {completedTopics.includes(topic.id) ? (
                <CheckCircle2 size={18} className="text-[#10B981]" />
              ) : (
                <Circle size={18} className="text-[#D1D5DB]" />
              )}
              <span className={`flex-1 text-left text-sm font-medium truncate ${currentTopicId === topic.id && view === 'learning' ? 'font-semibold' : ''}`}>
                {topic.title}
              </span>
              <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${currentTopicId === topic.id && view === 'learning' ? 'opacity-100' : ''}`} />
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-[#E5E7EB]">
          <div className="mb-2 flex justify-between items-end">
            <span className="text-xs font-semibold text-[#6B7280]">Progress</span>
            <span className="text-xs font-bold text-[#4F46E5]">{progressPercentage}%</span>
          </div>
          <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className="h-full bg-[#4F46E5]"
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'learning' ? (
            <motion.div 
              key="learning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Learning Area */}
              <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EEF2FF] text-[#4F46E5]">
                      {currentTopic.difficulty}
                    </span>
                    <span className="text-[#9CA3AF] text-sm">•</span>
                    <span className="text-[#9CA3AF] text-sm">Topic {currentTopic.order} of {CURRICULUM.length}</span>
                  </div>

                  <h2 className="text-4xl font-bold mb-6 tracking-tight text-[#111827]">{currentTopic.title}</h2>
                  
                  <div className="prose prose-slate max-w-none mb-12">
                    <p className="text-lg text-[#4B5563] leading-relaxed">
                      {currentTopic.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm mb-12">
                    <div className={`p-3 rounded-xl ${completedTopics.includes(currentTopic.id) ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#111827]">Mark as Complete</h4>
                      <p className="text-sm text-[#6B7280]">Track your progress by marking this topic as finished.</p>
                    </div>
                    <button 
                      onClick={() => toggleComplete(currentTopic.id)}
                      className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${completedTopics.includes(currentTopic.id) ? 'bg-[#10B981] text-white shadow-lg shadow-emerald-100' : 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-100 hover:bg-[#4338CA]'}`}
                    >
                      {completedTopics.includes(currentTopic.id) ? 'Completed' : 'Mark Done'}
                    </button>
                  </div>

                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-[#F59E0B]" />
                        <h3 className="font-bold text-[#111827]">What to study next?</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {suggestions.map(id => {
                          const topic = CURRICULUM.find(t => t.id === id);
                          if (!topic) return null;
                          return (
                            <button
                              key={id}
                              onClick={() => setCurrentTopicId(id)}
                              className="p-4 bg-white border border-[#E5E7EB] rounded-xl text-left hover:border-[#4F46E5] hover:shadow-md transition-all group"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider">{topic.difficulty}</span>
                                <ArrowRight size={14} className="text-[#9CA3AF] group-hover:text-[#4F46E5] transition-colors" />
                              </div>
                              <h4 className="font-bold text-[#111827] mb-1">{topic.title}</h4>
                              <p className="text-xs text-[#6B7280] line-clamp-2">{topic.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Interface Toggle Button */}
              {!isChatOpen && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsChatOpen(true)}
                  className="absolute bottom-6 right-6 w-14 h-14 bg-[#4F46E5] text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-[#4338CA] transition-colors"
                >
                  <MessageSquare size={24} />
                  {chatHistory.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {chatHistory.length}
                    </span>
                  )}
                </motion.button>
              )}

              {/* Chat Interface (Floating/Bottom) */}
              <AnimatePresence>
                {isChatOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 100, scale: 0.8, transformOrigin: 'bottom right' }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.8 }}
                    className="absolute bottom-6 right-6 w-96 max-h-[600px] flex flex-col bg-white border border-[#E5E7EB] rounded-3xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 bg-[#4F46E5] text-white flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <MessageSquare size={18} />
                        <span className="font-bold text-sm">Learning Assistant</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="flex flex-col items-end mr-1 flex-shrink-0">
                          <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Topic Progress</span>
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(((topicQuestionCounts[currentTopicId || ''] || 0) / QUESTIONS_FOR_COMPLETION) * 100, 100)}%` }}
                                className="h-full bg-emerald-400"
                              />
                            </div>
                            <span className="text-[9px] font-bold">{Math.min(Math.round(((topicQuestionCounts[currentTopicId || ''] || 0) / QUESTIONS_FOR_COMPLETION) * 100), 100)}%</span>
                          </div>
                        </div>
                        <button 
                          onClick={handleSummarize}
                          disabled={chatHistory.length === 0 || isTyping}
                          className="text-[9px] font-bold uppercase tracking-widest bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors disabled:opacity-50 flex-shrink-0"
                          title="Summarize conversation"
                        >
                          Summarize
                        </button>
                        <button 
                          onClick={() => setIsChatOpen(false)}
                          className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                        >
                          <ChevronRight size={18} className="rotate-90" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F9FAFB] min-h-[300px]">
                      {chatHistory.length === 0 && (
                        <div className="text-center py-8 px-4">
                          <div className="w-12 h-12 bg-[#EEF2FF] text-[#4F46E5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Info size={24} />
                          </div>
                          <h4 className="font-bold text-[#111827] mb-1">Have a question?</h4>
                          <p className="text-xs text-[#6B7280]">Ask me anything about {currentTopic.title} or other topics in the curriculum!</p>
                        </div>
                      )}

                      {chatHistory.length > MAX_DISPLAY_MESSAGES && !showFullHistory && (
                        <button 
                          onClick={() => setShowFullHistory(true)}
                          className="w-full py-2 text-[10px] font-bold text-[#4F46E5] bg-[#EEF2FF] rounded-lg hover:bg-[#E0E7FF] transition-colors uppercase tracking-widest"
                        >
                          Show older messages ({chatHistory.length - MAX_DISPLAY_MESSAGES} more)
                        </button>
                      )}

                      {(showFullHistory ? chatHistory : chatHistory.slice(-MAX_DISPLAY_MESSAGES)).map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#4F46E5] text-white rounded-tr-none' : 'bg-white border border-[#E5E7EB] text-[#374151] rounded-tl-none shadow-sm'}`}>
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-[#9CA3AF] mt-1 px-1">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex flex-col items-start">
                          <div className="bg-white border border-[#E5E7EB] p-3 rounded-2xl rounded-tl-none shadow-sm">
                            <div className="flex gap-1.5 items-center">
                              <motion.div 
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 0.6 }}
                                className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full" 
                              />
                              <motion.div 
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                                className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full" 
                              />
                              <motion.div 
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                                className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full" 
                              />
                            </div>
                          </div>
                          <span className="text-[10px] text-[#4F46E5] font-medium mt-1 px-1 animate-pulse">
                            Assistant is thinking...
                          </span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-[#E5E7EB] flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-1 bg-[#F3F4F6] border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] transition-all"
                      />
                      <button 
                        type="submit"
                        disabled={!inputMessage.trim() || isTyping}
                        className="bg-[#4F46E5] text-white p-2 rounded-xl hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 overflow-y-auto p-8 lg:p-12"
            >
              <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                  <header>
                    <h2 className="text-4xl font-bold tracking-tight text-[#111827] mb-2">Learning Dashboard</h2>
                    <p className="text-[#6B7280]">Track your progress and see how far you've come.</p>
                  </header>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all progress?')) {
                        setCompletedTopics([]);
                        setQuestionsAsked([]);
                        setChatHistory([]);
                        setTopicQuestionCounts({});
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
                  >
                    Reset Progress
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
                    <div className="w-10 h-10 bg-[#EEF2FF] text-[#4F46E5] rounded-xl flex items-center justify-center mb-4">
                      <BookOpen size={20} />
                    </div>
                    <div className="text-3xl font-bold text-[#111827] mb-1">{completedTopics.length}</div>
                    <div className="text-sm font-medium text-[#6B7280]">Topics Completed</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
                    <div className="w-10 h-10 bg-[#ECFDF5] text-[#10B981] rounded-xl flex items-center justify-center mb-4">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="text-3xl font-bold text-[#111827] mb-1">{CURRICULUM.length - completedTopics.length}</div>
                    <div className="text-sm font-medium text-[#6B7280]">Topics Remaining</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
                    <div className="w-10 h-10 bg-[#FFFBEB] text-[#F59E0B] rounded-xl flex items-center justify-center mb-4">
                      <MessageSquare size={20} />
                    </div>
                    <div className="text-3xl font-bold text-[#111827] mb-1">{questionsAsked.length}</div>
                    <div className="text-sm font-medium text-[#6B7280]">Questions Asked</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <section className="lg:col-span-2">
                    <h3 className="text-xl font-bold text-[#111827] mb-6 flex items-center gap-2">
                      <BookOpen size={20} className="text-[#4F46E5]" />
                      Curriculum Roadmap
                    </h3>
                    <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
                      {CURRICULUM.map((topic, index) => {
                        const isCompleted = completedTopics.includes(topic.id);
                        const isCurrent = currentTopicId === topic.id;
                        const isUpcoming = !isCompleted && !isCurrent;
                        
                        return (
                          <motion.div 
                            key={topic.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative"
                          >
                            {/* Status Dot */}
                            <div className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 z-10 transition-colors ${
                              isCompleted ? 'bg-[#10B981] border-[#10B981]' : 
                              isCurrent ? 'bg-white border-[#4F46E5]' : 
                              'bg-white border-[#D1D5DB]'
                            }`}>
                              {isCompleted && <CheckCircle2 size={10} className="text-white mx-auto mt-0.5" />}
                              {isCurrent && <div className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full mx-auto mt-0.5 animate-pulse" />}
                            </div>

                            <div className={`p-5 rounded-2xl border transition-all ${
                              isCurrent ? 'bg-[#EEF2FF] border-[#4F46E5] shadow-md' : 
                              isCompleted ? 'bg-white border-[#E5E7EB] opacity-80' : 
                              'bg-white border-[#E5E7EB] opacity-60'
                            }`}>
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                  isCompleted ? 'text-[#10B981]' : 
                                  isCurrent ? 'text-[#4F46E5]' : 
                                  'text-[#6B7280]'
                                }`}>
                                  {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Upcoming'}
                                </span>
                                <span className="text-[10px] font-medium text-[#9CA3AF]">Topic {topic.order}</span>
                              </div>
                              <h4 className="font-bold text-[#111827] mb-1">{topic.title}</h4>
                              <p className="text-xs text-[#6B7280] mb-4 line-clamp-1">{topic.description}</p>
                              
                              <button 
                                onClick={() => {
                                  setCurrentTopicId(topic.id);
                                  setView('learning');
                                }}
                                className={`text-xs font-bold flex items-center gap-1 transition-colors ${
                                  isCurrent ? 'text-[#4F46E5] hover:text-[#4338CA]' : 'text-[#6B7280] hover:text-[#111827]'
                                }`}
                              >
                                {isCompleted ? 'Review Topic' : isCurrent ? 'Continue Learning' : 'View Details'}
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-8">
                    <div>
                      <h3 className="text-xl font-bold text-[#111827] mb-6 flex items-center gap-2">
                        <MessageSquare size={20} className="text-[#F59E0B]" />
                        Recent Questions
                      </h3>
                      <div className="space-y-3">
                        {questionsAsked.length === 0 ? (
                          <div className="p-6 bg-[#F9FAFB] border border-dashed border-[#D1D5DB] rounded-2xl text-center">
                            <p className="text-xs text-[#6B7280]">No questions asked yet.</p>
                          </div>
                        ) : (
                          questionsAsked.slice(-5).reverse().map((q, i) => (
                            <div key={i} className="p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#4B5563] shadow-sm italic">
                              "{q}"
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-3xl text-white shadow-xl">
                      <Sparkles className="mb-4 opacity-80" size={24} />
                      <h4 className="font-bold mb-2">Keep it up!</h4>
                      <p className="text-xs opacity-90 leading-relaxed mb-4">
                        You're making great progress. Consistent learning is the key to mastering these concepts.
                      </p>
                      <button 
                        onClick={() => setView('learning')}
                        className="w-full py-2.5 bg-white text-[#4F46E5] rounded-xl text-xs font-bold hover:bg-opacity-90 transition-all"
                      >
                        Resume Learning
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
