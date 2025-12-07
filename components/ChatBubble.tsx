import React, { useState } from 'react';
import { TranscriptionItem } from '../types';

interface Props {
  item: TranscriptionItem;
}

export const ChatBubble: React.FC<Props> = ({ item }) => {
  const isUser = item.isUser;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Translation',
          text: item.text,
        });
      } catch (err) {
        console.log('Error sharing:', err);
        // Fallback to copy if share fails or is cancelled
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
      
      {/* Avatar / Logo (Professional 'B' Brand Mark) - Only for Bot */}
      {!isUser && (
        <div className="w-8 h-8 mr-4 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-sm flex-shrink-0 mt-0.5">
           <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
             <path d="M16.3 10.4c1.1-.8 1.7-2 1.7-3.4C18 4.2 15.8 2 13 2H6v20h8c3 0 5.5-2.5 5.5-5.5 0-2.3-1.3-4.3-3.2-5.1zM10 6h3c1.1 0 2 .9 2 2s-.9 2-2 2h-3V6zm3 12h-3v-4h3c1.1 0 2 .9 2 2s-.9 2-2 2z" />
           </svg>
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[90%] md:max-w-[85%]`}>
        
        {/* Message Bubble / Text Area */}
        <div 
          className={`
            text-base md:text-lg leading-relaxed
            ${isUser 
              ? 'bg-stone-800 text-white px-5 py-3.5 rounded-2xl rounded-br-none shadow-sm' 
              : 'text-stone-800 px-0 py-1 font-medium' // Clean text mode for Bot
            }
          `}
        >
          {item.text}
        </div>
        
        {/* Action Buttons - Only for Bot (Translated answers) */}
        {!isUser && (
          <div className="flex items-center gap-5 mt-3 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            
            {/* Copy */}
            <button 
              onClick={handleCopy} 
              className="group/btn flex items-center gap-1.5 text-stone-400 hover:text-stone-800 transition-colors"
              title="Copy"
              aria-label="Copy to clipboard"
            >
              {copied ? (
                 <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                 </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            {/* Like */}
            <button className="text-stone-400 hover:text-stone-800 transition-colors" title="Good translation">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>

            {/* Dislike */}
            <button className="text-stone-400 hover:text-stone-800 transition-colors" title="Bad translation">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </button>

            {/* Share */}
            <button onClick={handleShare} className="text-stone-400 hover:text-stone-800 transition-colors" title="Share">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>

          </div>
        )}
        
        {/* User Metadata */}
        {isUser && (
           <span className="text-[10px] text-stone-400 font-medium tracking-wider uppercase mt-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
             You
           </span>
        )}
      </div>
    </div>
  );
};