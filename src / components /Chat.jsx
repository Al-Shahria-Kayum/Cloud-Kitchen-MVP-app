import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Chat({ orderId, otherName }) {
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  // Ensure chat exists
  const ensureChat = async () => {
    let existing = await base44.entities.Chat.filter({ order_id: orderId });
    if (existing.length) return existing[0];
    return await base44.entities.Chat.create({ order_id: orderId });
  };

  const loadMessages = async (chatId) => {
    const msgs = await base44.entities.Message.filter({ chat_id: chatId }, "created_date", 100);
    setMessages(msgs);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const c = await ensureChat();
      setChat(c);
      await loadMessages(c.id);
      setLoading(false);
    })();

    const unsubMessages = base44.entities.Message.subscribe((event) => {
      if (!chat) return;
      if (event.data?.chat_id !== chat.id) return;
      if (event.type === "create") {
        setMessages((prev) =>
          prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]
        );
      }
    });
    return () => unsubMessages && unsubMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !chat) return;
    setSending(true);
    const body = text.trim();
    setText("");
    try {
      const msg = await base44.entities.Message.create({
        chat_id: chat.id,
        sender_id: user.id,
        text: body,
      });
      setMessages((prev) => [...prev, msg]);
      await base44.entities.Chat.update(chat.id, {
        last_message: body,
        last_sender_id: user.id,
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[26rem] flex-col rounded-xl border bg-card">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to {otherName || "the other party"}.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[72%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {m.created_date ? format(new Date(m.created_date), "MMM d, h:mm a") : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 border-t p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          className="h-10"
        />
        <Button size="icon" onClick={send} disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
