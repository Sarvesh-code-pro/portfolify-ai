import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Twitter, Linkedin, Link2, Check, Copy, Facebook, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
}

export function SocialShare({ url, title, description }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Portfolio link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: "Twitter",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: "hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]",
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: "hover:bg-[#1877F2]/10 hover:text-[#1877F2]",
    },
    {
      name: "Email",
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description || "")}%0A%0A${encodeURIComponent(url)}`,
      color: "hover:bg-primary/10 hover:text-primary",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyToClipboard} className="gap-2 cursor-pointer">
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="w-4 h-4 text-green-500" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Copy className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>
        
        {shareLinks.map((link) => (
          <DropdownMenuItem
            key={link.name}
            onClick={() => window.open(link.url, "_blank")}
            className={`gap-2 cursor-pointer ${link.color}`}
          >
            <link.icon className="w-4 h-4" />
            {link.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Floating share button for portfolio pages
export function FloatingShare({ url, title }: { url: string; title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const shareLinks = [
    {
      name: "Twitter",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      bg: "bg-[#1DA1F2]",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      bg: "bg-[#0A66C2]",
    },
    {
      name: "Copy",
      icon: Link2,
      url: "",
      bg: "bg-primary",
      action: async () => {
        await navigator.clipboard.writeText(url);
      },
    },
  ];

  return (
    <motion.div
      className="fixed left-6 bottom-6 z-40 flex flex-col-reverse gap-2"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 1.5 }}
    >
      <AnimatePresence>
        {isOpen && shareLinks.map((link, i) => (
          <motion.button
            key={link.name}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => {
              if (link.action) {
                link.action();
              } else {
                window.open(link.url, "_blank");
              }
            }}
            className={`w-10 h-10 rounded-full ${link.bg} text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}
          >
            <link.icon className="w-4 h-4" />
          </motion.button>
        ))}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="rounded-full w-12 h-12 shadow-lg"
        variant={isOpen ? "secondary" : "default"}
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
          <Share2 className="w-5 h-5" />
        </motion.div>
      </Button>
    </motion.div>
  );
}
