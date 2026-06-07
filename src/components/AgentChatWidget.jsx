import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Bot, Send, X, ChevronDown } from "lucide-react";

export default function AgentChatWidget({ agentName, onAgentAction }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const conversationRef = useRef(null);
  const bottomRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  const getOrCreateConversation = async () => {
    if (conversationRef.current) return conversationRef.current;

    const conv = await base44.agents.createConversation({ agent_name: agentName });
    conversationRef.current = conv;

    const unsub = base44.agents.subscribeToConversation(conv.id, (updated) => {
      const msgs = (updated.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      setMessages(msgs);
      const last = updated.messages?.[updated.messages.length - 1];
      if (last?.role === "assistant") {
        setLoading(false);
        if (onAgentAction) onAgentAction();
      }
    });
    unsubscribeRef.current = unsub;
    return conv;
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const conv = await getOrCreateConversation();
      await base44.agents.addMessage(conv, { role: "user", content: text });
    } catch (err) {
      console.error("Agent error:", err);
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <Card className="w-80 md:w-96 shadow-2xl border border-border flex flex-col" style={{ height: 420 }}>
          <CardHeader className="py-3 px-4 border-b flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <CardTitle className="text-sm font-semibold">Item Manager Agent</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Ask the agent to review your items, suggest status changes, or run a dashboard update.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </CardContent>

          <div className="p-3 border-t flex gap-2">
            <input
              className="flex-1 text-sm bg-muted rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-ring"
              placeholder="Ask the agent..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <Button
              type="button"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      )}

      <Button
        type="button"
        size="lg"
        className="rounded-full h-12 w-12 shadow-lg"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </Button>
    </div>
  );
}