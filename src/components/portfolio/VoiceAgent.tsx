import { useConversation } from "@elevenlabs/react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, X, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceAgentProps {
  portfolioName: string;
  aboutText?: string;
  skills?: string[];
  role?: string;
}

export function VoiceAgent({ portfolioName, skills, role }: VoiceAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to voice agent");
      setTranscript(prev => [...prev, "🤖 Hello! I'm an AI assistant for this portfolio. Ask me anything about " + portfolioName + "!"]);
    },
    onDisconnect: () => {
      console.log("Disconnected from voice agent");
    },
    onMessage: (message) => {
      console.log("Message:", message);
      if (message.message) {
        setTranscript(prev => [...prev, `🤖 ${message.message}`]);
      }
    },
    onError: (error) => {
      console.error("Voice agent error:", error);
      setError("Connection error. Please try again.");
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    setTranscript([]);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // For demo, we'll show a message about needing an agent ID
      // In production, this would be configured with a real ElevenLabs agent
      setTranscript([
        "🎙️ Voice agent demo mode activated!",
        `📋 Portfolio: ${portfolioName}`,
        `💼 Role: ${role || 'Professional'}`,
        `🛠️ Skills: ${skills?.slice(0, 5).join(', ') || 'Various'}`,
        "",
        "💡 To enable full voice capabilities, configure an ElevenLabs Conversational AI agent with your portfolio context."
      ]);
      
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setError("Microphone access required. Please enable microphone permissions.");
    } finally {
      setIsConnecting(false);
    }
  }, [portfolioName, role, skills]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setTranscript([]);
  }, [conversation]);

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
          className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 p-0"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <MessageCircle className="w-6 h-6" />
          </motion.div>
        </Button>
        
        {/* Pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.div>

      {/* Voice agent modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-purple-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Portfolio Assistant</h3>
                    <p className="text-xs text-muted-foreground">Ask me about {portfolioName}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Transcript area */}
              <div className="h-64 overflow-y-auto p-4 space-y-3">
                {transcript.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Mic className="w-12 h-12 mb-4 opacity-30" />
                    </motion.div>
                    <p className="text-sm">Click the microphone to start talking</p>
                    <p className="text-xs mt-1">Ask anything about this portfolio</p>
                  </div>
                ) : (
                  transcript.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm"
                    >
                      {msg}
                    </motion.div>
                  ))
                )}
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    {error}
                  </div>
                )}
              </div>

              {/* Voice indicator */}
              {conversation.isSpeaking && (
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    AI is speaking...
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="p-4 border-t border-border flex justify-center">
                {conversation.status === "disconnected" ? (
                  <Button
                    onClick={startConversation}
                    disabled={isConnecting}
                    size="lg"
                    className="rounded-full px-8 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
                    className="rounded-full px-8"
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
