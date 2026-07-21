"use client";

import React, { useEffect, useState } from "react";
import { X, Phone, User, BookOpen, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Coordinator {
  name: string;
  phone: string;
}

interface EventFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  rulebookPath?: string;
  coordinators?: Coordinator[];
}

export default function EventFaqModal({
  isOpen,
  onClose,
  title,
  rulebookPath,
  coordinators = [],
}: EventFaqModalProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;

    if (!rulebookPath) {
      setContent("No rulebook or details are currently available for this event.");
      return;
    }

    const fetchRulebook = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(rulebookPath);
        if (!response.ok) {
          throw new Error("Failed to load event details.");
        }
        const text = await response.text();
        setContent(text);
      } catch (err: any) {
        setError(err.message || "Failed to load details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRulebook();
  }, [isOpen, rulebookPath]);

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-black/90 border border-red-500/35 shadow-[0_0_50px_rgba(220,38,38,0.25)] rounded-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all duration-300 transform scale-100">
        
        {/* Cyberpunk corner lines */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500/70 pointer-events-none" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500/70 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500/70 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500/70 pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 border-b border-red-500/20 flex items-center justify-between bg-red-950/10">
          <div className="flex items-center gap-2 text-white">
            <BookOpen className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-wide">
              {title} - Details & Rules
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-red-500 hover:bg-red-500/10 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-300 custom-scrollbar select-text">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
              <p className="text-sm font-mono text-gray-400 uppercase tracking-widest">// DECRYPTING DATA STREAM...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400 border border-red-500/20 rounded-xl bg-red-500/5">
              <p className="font-mono text-sm">{error}</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-white prose-headings:font-bold prose-a:text-red-400 hover:prose-a:text-red-300 prose-hr:border-white/10 prose-th:border-white/20 prose-td:border-white/10">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Add custom styling for markdown elements
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4 font-mono tracking-wide border-b border-white/15 pb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold text-red-400 mt-6 mb-3 font-mono tracking-wide uppercase" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-gray-300" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-gray-300" {...props} />,
                  li: ({node, ...props}) => <li className="text-sm sm:text-base font-sans" {...props} />,
                  p: ({node, ...props}) => <p className="text-sm sm:text-base leading-relaxed mb-4 text-gray-300 font-sans" {...props} />,
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-6 border border-white/15 rounded-lg bg-black/40">
                      <table className="w-full text-left border-collapse" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => <thead className="bg-red-950/20 border-b border-white/15" {...props} />,
                  tbody: ({node, ...props}) => <tbody className="divide-y divide-white/10" {...props} />,
                  th: ({node, ...props}) => <th className="px-4 py-3 text-xs sm:text-sm font-semibold text-white uppercase tracking-wider font-mono" {...props} />,
                  td: ({node, ...props}) => <td className="px-4 py-3 text-xs sm:text-sm text-gray-300 font-sans" {...props} />,
                  hr: ({node, ...props}) => <hr className="my-6 border-white/10" {...props} />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Modal Footer (Coordinators details) */}
        {coordinators.length > 0 && (
          <div className="p-5 border-t border-red-500/20 bg-red-950/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Event Coordinators
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Need help or clarification? Contact us directly:</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {coordinators.map((c, index) => (
                <a
                  key={index}
                  href={`tel:${c.phone}`}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-red-500 hover:bg-red-500/10 px-3.5 py-1.5 rounded-xl text-sm font-medium text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-red-500" />
                  <span>{c.name}</span>
                  <span className="text-gray-500 text-xs font-mono">({c.phone})</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
