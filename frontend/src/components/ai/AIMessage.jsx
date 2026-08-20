import React from 'react';
import { Bot, User, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AIChartRenderer } from './AIChartRenderer';

export const AIMessage = ({ msg }) => {
  const isUser = msg.sender === 'user';

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        isUser ? 'bg-[#697565] text-[#ECDFCC]' : 'bg-[#3C3D37] text-[#ECDFCC] border border-[#4A4B44]'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#697565]" />}
      </div>

      <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
        isUser
          ? 'bg-[#697565] text-[#ECDFCC] rounded-tr-none shadow-md'
          : 'bg-[#2A2E24] text-[#ECDFCC] rounded-tl-none border border-[#3C3D37]'
      }`}>
        {/* Markdown Formatted Text */}
        <div className="prose prose-invert prose-xs max-w-none text-xs text-[#ECDFCC] space-y-1.5 font-sans leading-relaxed">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-bold text-[#ECDFCC]">{children}</strong>,
              em: ({ children }) => <em className="italic text-[#ECDFCC]/90">{children}</em>,
              ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
              li: ({ children }) => <li className="text-xs">{children}</li>,
              h1: ({ children }) => <h1 className="text-sm font-bold text-[#ECDFCC] mt-2 mb-1">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xs font-bold text-[#ECDFCC] mt-2 mb-1">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xs font-bold text-[#ECDFCC] mt-1.5 mb-1">{children}</h3>,
              code: ({ children }) => <code className="bg-[#181C14] px-1 py-0.5 rounded text-[11px] font-mono text-[#697565]">{children}</code>
            }}
          >
            {msg.text}
          </ReactMarkdown>
        </div>

        {/* Executed Action Badges */}
        {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-[#3C3D37] flex flex-col gap-1">
            {msg.actionsExecuted.map((act, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#4CAF50] bg-[#181C14] px-2 py-1 rounded-md border border-[#3C3D37]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{act.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Render Charts if present */}
        {msg.charts && msg.charts.length > 0 && (
          <div className="mt-2">
            {msg.charts.map((chart, idx) => (
              <AIChartRenderer key={idx} chart={chart} />
            ))}
          </div>
        )}

        <span className={`block text-[9px] mt-1.5 text-right ${isUser ? 'text-[#ECDFCC]/70' : 'text-[#9C9589]'}`}>
          {msg.timestamp}
        </span>
      </div>
    </div>
  );
};
