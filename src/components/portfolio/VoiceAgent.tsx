import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface VoiceAgentProps {
  portfolioName: string;
  aboutText?: string;
  skills?: string[];
  role?: string;
}

export function VoiceAgent({ portfolioName }: VoiceAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      setTranscript((prev) => [
        ...prev,
        { role: "system", text: `Connected! Ask me anything about ${portfolioName}.` },
      ]);
    },
    onDisconnect: () => {
      setTranscript((prev) => [...prev, { role: "system", text: "Conversation ended." }]);
    },
    onMessage: (message) => {
      setTranscript((prev) => [...prev, { role: message.role, text: message.message }]);
    },
    onError: (err) => {
      console.error("Voice agent error:", err);
      setError("Connection error. Please try again.");
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    setTranscript([]);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error: fnError } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (fnError || !data?.token) {
        throw new Error(fnError?.message || "Failed to get conversation token");
      }

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (err: any) {
      console.error("Failed to start conversation:", err);
      setError(
        err?.message?.includes("Microphone")
          ? "Microphone access required. Please enable microphone permissions."
          : err?.message || "Failed to start voice agent. Please try again."
      );
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // Audio visualizer bars
  const AudioBars = () => (
    <div className="flex items-center gap-[3px] h-6">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-primary"
          animate={{
            height: conversation.isSpeaking
              ? [8, 20, 12, 24, 8]
              : [4, 6, 4, 6, 4],
          }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Floating voice button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: "spring" }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-16 h-16 shadow-xl bg-gradient-to-br from-primary to-[hsl(262_83%_58%)] hover:from-primary/90 hover:to-[hsl(262_83%_58%/0.9)] p-0 border-2 border-primary/20"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Mic className="w-7 h-7" />
          </motion.div>
        </Button>

        {/* Pulse rings */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/40"
          animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          animate={{ scale: [1, 2], opacity: [0.4, 0] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
        />
      </motion.div>

      {/* Voice agent modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/60 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-[hsl(262_83%_58%/0.05)]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-[hsl(262_83%_58%)] flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">AI Voice Assistant</h3>
                    <p className="text-xs text-muted-foreground">
                      {conversation.status === "connected" ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                          Live — {conversation.isSpeaking ? "Speaking" : "Listening"}
                        </span>
                      ) : (
                        `Ask about ${portfolioName}`
                      )}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Transcript area */}
              <div ref={scrollRef} className="h-72 overflow-y-auto p-5 space-y-3 scroll-smooth">
                {transcript.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-4">
                    <motion.div
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-[hsl(262_83%_58%/0.1)] flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    >
                      <Mic className="w-8 h-8 text-primary/40" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium">Tap the button to start</p>
                      <p className="text-xs mt-1">Ask anything about this portfolio</p>
                    </div>
                  </div>
                ) : (
                  transcript.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : msg.role === "system"
                            ? "bg-muted text-muted-foreground text-xs text-center w-full rounded-xl"
                            : "bg-secondary text-secondary-foreground rounded-bl-md"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))
                )}
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20"
                  >
                    {error}
                  </motion.div>
                )}
              </div>

              {/* Audio visualizer */}
              {conversation.status === "connected" && (
                <div className="px-5 pb-2 flex items-center justify-center gap-3 text-xs text-muted-foreground">
                  <AudioBars />
                  {conversation.isSpeaking && (
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-primary" />
                      AI is speaking...
                    </span>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="p-5 border-t border-border/50 flex justify-center">
                {conversation.status === "disconnected" ? (
                  <Button
                    onClick={startConversation}
                    disabled={isConnecting}
                    size="lg"
                    className="rounded-2xl px-10 py-6 bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:from-primary/90 hover:to-[hsl(262_83%_58%/0.9)] shadow-lg shadow-primary/20 font-display font-semibold text-base"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        Start Talking
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={stopConversation}
                    size="lg"
                    variant="destructive"
                    className="rounded-2xl px-10 py-6 font-display font-semibold text-base"
                  >
                    <MicOff className="w-5 h-5 mr-2" />
                    End Conversation
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
