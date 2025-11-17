"use client";

import { useState, FormEvent } from "react";
import { Bot, Send, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat-message-list";

interface Message {
  id: number;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "🙏 Swamiye Saranam Ayyappa!\n\nI'm here to help you with:\n• Sabarimala Yatra information\n• Annadanam booking\n• Pooja booking\n• About Sabari Sastha Seva Samithi\n\nHow may I assist you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      content: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput("");
    setIsLoading(true);

    // Create placeholder AI message for streaming
    const aiMessageId = messages.length + 2;
    const aiMessage: Message = {
      id: aiMessageId,
      content: "",
      sender: "ai",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userInput,
          history: messages.slice(1).map((msg) => ({
            role: msg.sender === "user" ? "user" : "model",
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      if (!reader) {
        throw new Error("No response stream");
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                accumulatedText += data.text;
                
                // Clean markdown in real-time
                let cleanText = accumulatedText;
                cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, "$1");
                cleanText = cleanText.replace(/\*(.*?)\*/g, "$1");
                
                // Update message in real-time
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: cleanText }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: "Sorry, I'm having trouble connecting right now. Please try again." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const QuickActions = () => (
    <div className="grid grid-cols-2 gap-2 mb-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setInput("How do I book Annadanam?")}
        className="text-xs h-auto py-2"
      >
        Annadanam Booking
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setInput("Tell me about Sabarimala Yatra")}
        className="text-xs h-auto py-2"
      >
        Yatra Info
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setInput("How to book Pooja?")}
        className="text-xs h-auto py-2"
      >
        Pooja Booking
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setInput("What is the dress code?")}
        className="text-xs h-auto py-2"
      >
        Dress Code
      </Button>
    </div>
  );

  return (
    <ExpandableChat
      size="lg"
      position="bottom-right"
      icon={<Bot className="h-6 w-6" />}
    >
      <ExpandableChatHeader className="flex-col text-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
        <h1 className="text-xl font-semibold">AI Assistant ✨</h1>
        <p className="text-sm opacity-90 mt-1">
          Ask me about Sabarimala Yatra & Bookings
        </p>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <ChatMessageList smooth>
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.sender === "user" ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                src={message.sender === "ai" ? "/logo.jpeg" : undefined}
                fallback={message.sender === "user" ? "U" : "AI"}
              />
              <ChatBubbleMessage
                variant={message.sender === "user" ? "sent" : "received"}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {isLoading && messages[messages.length - 1]?.content === "" && (
            <ChatBubble variant="received">
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter className="flex-shrink-0 pb-safe">
        {messages.length <= 1 && <QuickActions />}
        <form
          onSubmit={handleSubmit}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask me anything about Sabarimala..."
            className="min-h-12 max-h-24 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0 text-sm"
            disabled={isLoading}
          />
          <div className="flex items-center p-3 pt-0 justify-end">
            <Button 
              type="submit" 
              size="sm" 
              className="gap-1.5"
              disabled={!input.trim() || isLoading}
            >
              Send Message
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
}
