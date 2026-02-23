"use client";

import { useState, useRef, useEffect } from "react";
import type { BoardData } from "@/lib/kanban";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface AIChatSidebarProps {
  userId: number;
  onUpdateBoard: (newBoard: BoardData) => void;
}

export function AIChatSidebar({ userId, onUpdateBoard }: AIChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          user_id: userId,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response_message }]);
        
        if (data.board && data.board.columns) {
          const dbBoard = data.board;
          dbBoard.columns.sort((a: any, b: any) => a.order - b.order);
          
          const columns = dbBoard.columns.map((c: any) => ({
            id: `col-${c.id}`,
            title: c.title,
            cardIds: c.cards.sort((a: any, b: any) => a.order - b.order).map((card: any) => `card-${card.id}`),
          }));
          
          const cards: Record<string, any> = {};
          dbBoard.columns.forEach((c: any) => {
            c.cards.forEach((card: any) => {
              const cid = `card-${card.id}`;
              cards[cid] = {
                id: cid,
                title: card.title,
                details: card.description || "",
              };
            });
          });
          
          onUpdateBoard({ columns, cards });
        }
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.detail || "Error." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-blue)] text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Open AI Chat"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-[var(--stroke)] bg-white shadow-2xl transition-transform" data-testid="ai-sidebar">
          <div className="flex items-center justify-between border-b border-[var(--stroke)] p-4">
            <h2 className="font-semibold text-[var(--navy-dark)]">AI Assistant</h2>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-2 hover:bg-gray-100 text-[var(--gray-text)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-sm text-[var(--gray-text)] text-center mt-10">
                Ask me to modify the board, e.g. "Add a card to Backlog for creating tests".
              </p>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-[var(--primary-blue)] text-white" : "bg-gray-100 text-[var(--navy-dark)]"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-gray-100 text-[var(--gray-text)] animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-[var(--stroke)] p-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the AI..."
                className="flex-1 rounded-full border border-[var(--stroke)] px-4 py-2 text-sm focus:border-[var(--primary-blue)] focus:outline-none"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="flex items-center justify-center rounded-full bg-[var(--primary-blue)] px-4 py-2 text-white disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
