import React, { useEffect, useRef, useState } from 'react';
import { useLiveTranslator } from './hooks/useLiveTranslator';
import { Visualizer } from './components/Visualizer';
import { ChatBubble } from './components/ChatBubble';
import { RecorderState } from './types';

const App: React.FC = () => {
  const { 
    startRecording, 
    stopRecording, 
    translateText,
    recorderState, 
    volume, 
    transcriptions 
  } = useLiveTranslator();

  const [inputText, setInputText] = useState('');
  const scrollEndRef = useRef<HTMLDivElement>(null);
  
  const isRecording = recorderState === RecorderState.RECORDING;
  const isProcessing = recorderState === RecorderState.PROCESSING;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptions, recorderState]);

  const handleSend = () => {
    if (inputText.trim()) {
      translateText(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if (isProcessing) return; 

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#fafaf9] text-stone-800 font-sans">
      
      {/* Chat Area - No Header */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-[60vh]">
          
          {/* Welcome Empty State */}
          {transcriptions.length === 0 && !isRecording && !isProcessing && (
             <div className="flex flex-col items-center justify-center py-20 opacity-60 h-full">
                <div className="w-24 h-24 bg-stone-900 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                   <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white">
                     <path d="M16.3 10.4c1.1-.8 1.7-2 1.7-3.4C18 4.2 15.8 2 13 2H6v20h8c3 0 5.5-2.5 5.5-5.5 0-2.3-1.3-4.3-3.2-5.1zM10 6h3c1.1 0 2 .9 2 2s-.9 2-2 2h-3V6zm3 12h-3v-4h3c1.1 0 2 .9 2 2s-.9 2-2 2z" />
                   </svg>
                </div>
                <h2 className="text-2xl font-bold text-stone-800 mb-2 tracking-tight">BengoLink</h2>
                <p className="text-stone-500 font-medium">Tap Mic, Speak Bengali, Stop</p>
                <p className="text-sm text-stone-400 mt-1">Instant English Translation</p>
             </div>
          )}

          {transcriptions.map((item) => (
            <ChatBubble key={item.id} item={item} />
          ))}
          
          {/* Status Indicator */}
          {(isRecording || isProcessing) && (
            <div className="flex w-full justify-center py-4 animate-fade-in">
               <div className={`
                  px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 shadow-sm border transition-colors duration-300
                  ${isProcessing 
                    ? 'bg-stone-100 border-stone-200 text-stone-500' 
                    : 'bg-red-50 border-red-100 text-red-600'
                  }
               `}>
                  <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-stone-400' : 'bg-red-500 animate-pulse'}`}></span>
                  {isProcessing ? 'Translating your speech...' : 'Recording...'}
               </div>
            </div>
          )}

          <div ref={scrollEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area - Transparent Container */}
      <div className="flex-none p-4 md:p-6 pb-8 md:pb-10 z-20 bg-transparent">
        <div className="max-w-3xl mx-auto relative">
          
          {/* The Input Bar Container */}
          <div className={`
            flex items-center gap-2 pl-3 pr-1 py-1 rounded-full transition-colors duration-200
            bg-white shadow-sm
            ${(isRecording || isProcessing)
              ? 'border border-red-300' 
              : 'border border-stone-300 focus-within:border-stone-800'
            }
          `}>
            
            {/* Visualizer (Only shows when recording) */}
            {(isRecording || isProcessing) && (
              <div className="flex-shrink-0 mr-1">
                <Visualizer isActive={isRecording} volume={volume} />
              </div>
            )}

            {/* Text Input */}
            <input
              type="text"
              value={isRecording ? '' : inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isRecording || isProcessing}
              placeholder={
                isRecording ? "Tap mic to finish..." : 
                isProcessing ? "Processing..." :
                "Type a message..."
              }
              className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 ring-0 text-stone-800 placeholder-stone-400 text-base py-2 disabled:cursor-not-allowed disabled:text-stone-400 min-w-0"
            />

            {/* Action Button: Toggle Mic or Send Text */}
            <div className="flex-shrink-0">
              {inputText.trim() && !isRecording && !isProcessing ? (
                // Send Button
                <button
                  onClick={handleSend}
                  className="w-9 h-9 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-stone-700 transition-colors shadow-sm active:scale-95"
                >
                  <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                // Mic Button
                <button
                  onClick={toggleVoice}
                  disabled={isProcessing}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                    ${isProcessing
                      ? 'bg-stone-200 text-stone-400 cursor-wait'
                      : isRecording 
                        ? 'bg-red-500 text-white shadow-red-200 animate-pulse active:scale-95' 
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-95'
                    }
                  `}
                >
                  {isProcessing ? (
                     <div className="w-4 h-4 border-2 rounded-full animate-spin border-stone-400 border-t-stone-600"></div>
                  ) : isRecording ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/> {/* Checkmark icon for "Finish" */}
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  )}
                </button>
              )}
            </div>

          </div>
          
          {/* Footer Hint */}
          <div className="text-center mt-3">
             <p className="text-[10px] text-stone-400 opacity-70">
                {isRecording 
                  ? "Tap the mic again to translate." 
                  : isProcessing 
                    ? "Gemini is translating..."
                    : "AI Translator"
                }
             </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default App;