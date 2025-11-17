"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export default function GeminiLiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Tracks if AI is generating response
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "🙏 Swamiye Saranam Ayyappa! Click 'Start Live' to begin voice conversation.",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true; // Keep listening
        recognitionRef.current.interimResults = true; // Show partial results
        recognitionRef.current.lang = "en-IN";

        recognitionRef.current.onresult = (event: any) => {
          // CRITICAL: Block ALL input when AI is processing or speaking
          if (isSpeaking || isProcessing) {
            return; // Ignore everything
          }

          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setCurrentTranscript(interimTranscript || finalTranscript);

          // If final result, process it
          if (finalTranscript && !isSpeaking && !isProcessing) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (finalTranscript.trim() && !isSpeaking && !isProcessing) {
                submitVoiceMessage(finalTranscript.trim());
                setCurrentTranscript("");
              }
            }, 2000); // Wait 2s for user to finish speaking
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          // "aborted" error is intentional (we abort mic when AI speaks) - ignore it
          if (event.error === "aborted") {
            return; // This is expected behavior, not an error
          }
          
          // Log other errors for debugging
          if (event.error !== "no-speech") {
            console.error("Speech error:", event.error);
          }
          
          if (event.error === "no-speech" && isLive && !isSpeaking && !isProcessing) {
            // Restart listening after silence timeout
            setTimeout(() => {
              if (isLive && !isSpeaking && !isProcessing && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                  setIsListening(true);
                } catch (e) {
                  // Already started
                }
              }
            }, 500);
          }
        };

        recognitionRef.current.onend = () => {
          // Only auto-restart if in live mode AND AI is not speaking
          if (isLive && !isSpeaking) {
            try {
              setTimeout(() => {
                if (isLive && !isSpeaking && recognitionRef.current) {
                  recognitionRef.current.start();
                  setIsListening(true);
                }
              }, 300);
            } catch (e) {
              // Already started
            }
          } else {
            setIsListening(false);
          }
        };
      }

      // Initialize Speech Synthesis
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis;
      }
    }
  }, [isLive]);

  // CRITICAL: Microphone control - Prevent echo by stopping during AI activity
  useEffect(() => {
    if (!recognitionRef.current) return;

    // BLOCK mic completely when AI is busy (processing OR speaking)
    if (isSpeaking || isProcessing) {
      try {
        recognitionRef.current.abort(); // Force stop (triggers "aborted" error - that's OK)
        setIsListening(false);
        setCurrentTranscript(""); // Clear any captured text
        clearTimeout(silenceTimerRef.current); // Cancel any pending submissions
      } catch (e) {
        // Mic already stopped - ignore
      }
    } 
    // ONLY restart when both processing AND speaking are complete
    else if (isLive && !isSpeaking && !isProcessing) {
      const restartDelay = setTimeout(() => {
        // Triple-check all states before restarting (prevent any chance of echo)
        if (isLive && !isSpeaking && !isProcessing && recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
            console.log("✅ Mic restarted - Ready for your input");
          } catch (e) {
            // Mic already running - ignore
          }
        }
      }, 2000); // Wait 2 full seconds after AI completely finishes

      return () => clearTimeout(restartDelay);
    }
  }, [isSpeaking, isProcessing, isLive]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentTranscript]);

  const submitVoiceMessage = async (text: string) => {
    // Set processing flag IMMEDIATELY to block mic
    setIsProcessing(true);
    setIsListening(false);
    
    // Force stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }

    const userMessage: Message = {
      id: Date.now(),
      content: text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Get AI response with streaming
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(1).map((msg) => ({
            role: msg.sender === "user" ? "user" : "model",
            content: msg.content,
          })),
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      const aiMessageId = Date.now();

      // Create placeholder message
      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, content: "", sender: "ai" as const, timestamp: new Date() },
      ]);

      if (reader) {
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
                  const cleanText = accumulatedText
                    .replace(/\*\*(.*?)\*\*/g, "$1")
                    .replace(/\*(.*?)\*/g, "$1");
                  
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId ? { ...msg, content: cleanText } : msg
                    )
                  );
                }
              } catch (e) {
                // Skip
              }
            }
          }
        }

        // Speak response after streaming completes
        if (accumulatedText) {
          await speakText(accumulatedText);
          // Mark processing as complete
          setIsProcessing(false);
          // useEffect will handle restarting mic after isSpeaking and isProcessing are both false
        } else {
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setIsProcessing(false); // Reset on error
    }
  };

  const speakText = async (text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      setIsSpeaking(true); // Block mic immediately

      // Clean text for speech
      const cleanText = text
        .replace(/[🙏💰📱✅🚫👥🗓️💬📊📋*#]/g, "")
        .replace(/•/g, "")
        .replace(/\n+/g, ". ")
        .replace(/\s+/g, " ")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .trim();

      if (!cleanText) {
        setIsSpeaking(false);
        resolve();
        return;
      }

      try {
        // Use AWS Polly via Edge TTS (free, better quality than browser)
        // Or use Google Cloud TTS if you have it
        // For now, using browser TTS with best available voice
        
        if (!synthRef.current) {
          setIsSpeaking(false);
          resolve();
          return;
        }

        // Cancel any ongoing speech
        synthRef.current.cancel();
        
        // Wait a moment for cancellation to complete
        await new Promise(r => setTimeout(r, 100));

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Get best available voice
        let voices = synthRef.current.getVoices();
        
        // Retry voice loading if empty
        if (voices.length === 0) {
          await new Promise(r => {
            synthRef.current!.onvoiceschanged = () => {
              voices = synthRef.current?.getVoices() || [];
              r(null);
            };
          });
        }

        // Priority order for best quality (Nova not available in browser, using alternatives)
        const voice = 
          voices.find(v => v.name.includes("Google") && v.lang.includes("en-IN")) || // Google Indian
          voices.find(v => v.name.includes("Google") && v.lang.includes("en-GB")) || // Google British
          voices.find(v => v.name.includes("Samantha")) || // Mac Samantha (excellent)
          voices.find(v => v.name.includes("Karen")) || // Mac Karen
          voices.find(v => v.lang === "en-IN") ||
          voices.find(v => v.lang === "en-GB") ||
          voices.find(v => v.lang.startsWith("en")) ||
          voices[0];

        if (voice) {
          utterance.voice = voice;
          console.log("🔊 Using voice:", voice.name, voice.lang);
        }
        
        utterance.lang = "en-IN";
        utterance.rate = 1.0; // Normal speed
        utterance.pitch = 1.0; // Natural pitch
        utterance.volume = 1.0;

        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        utterance.onerror = (e) => {
          console.error("Speech error:", e);
          setIsSpeaking(false);
          resolve();
        };

        synthRef.current.speak(utterance);
        
      } catch (error) {
        console.error("TTS error:", error);
        setIsSpeaking(false);
        resolve();
      }
    });
  };

  const toggleLive = () => {
    if (isLive) {
      // Stop live mode
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
      setIsLive(false);
      setIsListening(false);
      setIsSpeaking(false);
      setCurrentTranscript("");
    } else {
      // Start live mode
      setIsLive(true);
      setIsListening(true);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Failed to start:", e);
      }
    }
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  return (
    <>
      {/* Floating Live Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center transition-all duration-300 hover:scale-110"
        >
          <Bot className="h-7 w-7 text-white" />
        </button>
      )}

      {/* Live Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full h-full sm:w-[450px] sm:h-[700px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6" />
              <div>
                <h2 className="font-semibold text-lg">AI Assistant ✨</h2>
                <p className="text-xs opacity-90">
                  {isLive ? "🔴 Live Conversation" : "Voice Assistant"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                if (isLive) toggleLive();
              }}
              className="p-2 hover:bg-white/20 rounded-lg"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.sender === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">U</span>
                  </div>
                )}
              </div>
            ))}

            {/* Current transcript (while user is speaking) */}
            {currentTranscript && (
              <div className="flex justify-end gap-2 opacity-70">
                <div className="max-w-[75%] rounded-2xl px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-sm">
                  <p className="whitespace-pre-wrap">{currentTranscript}</p>
                </div>
              </div>
            )}

            {/* Status indicator */}
            {isLive && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                  {isListening && !isSpeaking && (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      <span>Listening...</span>
                    </>
                  )}
                  {isSpeaking && (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span>AI Speaking...</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Live Controls */}
          <div className="border-t p-4 bg-muted/30 flex-shrink-0">
            {!isLive ? (
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                  <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
                    <strong>💡 Tip:</strong> Use headphones for best experience (prevents echo)
                  </p>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Start a live voice conversation with AI
                </p>
                <Button
                  onClick={toggleLive}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-2"
                  size="lg"
                >
                  <Phone className="h-5 w-5" />
                  Start Live Conversation
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Live Status */}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      isListening ? "bg-red-500 animate-pulse" : "bg-gray-400"
                    )}></div>
                    <span className="text-xs text-muted-foreground">
                      {isListening ? "Listening" : "Paused"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      isSpeaking ? "bg-green-500 animate-pulse" : "bg-gray-400"
                    )}></div>
                    <span className="text-xs text-muted-foreground">
                      {isSpeaking ? "Speaking" : "Quiet"}
                    </span>
                  </div>
                </div>

                {/* Current transcript preview */}
                {currentTranscript && (
                  <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 text-sm text-center border-2 border-purple-300 dark:border-purple-700">
                    <p className="text-purple-700 dark:text-purple-300">
                      "{currentTranscript}"
                    </p>
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={stopSpeaking}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={!isSpeaking}
                  >
                    <VolumeX className="h-5 w-5 mr-2" />
                    Stop Speaking
                  </Button>
                  <Button
                    onClick={toggleLive}
                    variant="destructive"
                    size="lg"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <PhoneOff className="h-5 w-5 mr-2" />
                    End Call
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Speak naturally. AI responds automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

