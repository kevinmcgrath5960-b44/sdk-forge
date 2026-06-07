import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Plus, Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function AIChat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Load current user + conversations on mount
  useEffect(() => {
    base44.auth.me().then((user) => {
      setCurrentUser(user);
      loadConversations(user.id);
    });
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async (userId) => {
    const convs = await base44.entities.Conversation.filter(
      { created_by_id: userId },
      "-created_date",
      50
    );
    setConversations(convs);
  };

  const loadMessages = async (convId) => {
    const msgs = await base44.entities.Message.filter(
      { conversation_id: convId },
      "created_date",
      200
    );
    setMessages(msgs);
  };

  const openConversation = (conv) => {
    setActiveConvId(conv.id);
    loadMessages(conv.id);
  };

  const startNewChat = async () => {
    const conv = await base44.entities.Conversation.create({ title: "" });
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(conv.id);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConvId || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // 1. Save user message
    const userMsg = await base44.entities.Message.create({
      conversation_id: activeConvId,
      role: "user",
      content: text,
    });
    setMessages((prev) => [...prev, userMsg]);

    // 2. Set title if this is the first message
    const conv = conversations.find((c) => c.id === activeConvId);
    if (conv && !conv.title) {
      const title = text.slice(0, 40);
      await base44.entities.Conversation.update(activeConvId, { title });
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, title } : c))
      );
    }

    // 3. Build full history for this conversation
    const allMessages = [...messages, userMsg];
    const history = allMessages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");
    const prompt = `${history}\nAssistant:`;

    // 4. Call LLM with full context
    const reply = await base44.integrations.Core.InvokeLLM({ prompt });

    // 5. Save assistant reply
    const assistantMsg = await base44.entities.Message.create({
      conversation_id: activeConvId,
      role: "assistant",
      content: reply,
    });
    setMessages((prev) => [...prev, assistantMsg]);
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col bg-card shrink-0">
        <div className="p-3 border-b">
          <Button onClick={startNewChat} className="w-full gap-2" size="sm">
            <Plus className="w-4 h-4" /> New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors",
                  conv.id === activeConvId
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <MessageSquare className="w-3.5 h-3.5 inline mr-2 opacity-60" />
                {conv.title || "New conversation"}
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-4 text-center">
                No conversations yet
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-3 border-b bg-card flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">
            {activeConv?.title || (activeConvId ? "New conversation" : "AI Chat")}
          </span>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {!activeConvId ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
              <Bot className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Select a conversation or start a new one.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
              <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Send a message to get started.</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-card">
          <div className="max-w-3xl mx-auto flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeConvId ? "Message... (Enter to send)" : "Start a new chat first"}
              disabled={!activeConvId || sending}
              rows={1}
              className="resize-none min-h-[40px] max-h-32"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || !activeConvId || sending}
              size="icon"
              className="shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}