import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, AlertCircle, CheckCircle2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomDomainEditorProps {
  customDomain: string | null;
  username: string;
  isPublished: boolean;
  onChange: (domain: string | null) => void;
}

export function CustomDomainEditor({
  customDomain,
  username,
  isPublished,
  onChange,
}: CustomDomainEditorProps) {
  const [inputValue, setInputValue] = useState(customDomain || "");
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const cleanDomain = (raw: string) => {
    let d = raw.trim().toLowerCase();
    d = d.replace(/^https?:\/\//, "");
    d = d.replace(/\/+$/, "");
    return d;
  };

  const handleSave = () => {
    const cleaned = cleanDomain(inputValue);
    if (!cleaned) {
      onChange(null);
      toast({ title: "Custom domain removed" });
      return;
    }
    // Basic domain validation
    const domainRegex = /^([a-z0-9-]+\.)+[a-z]{2,}$/;
    if (!domainRegex.test(cleaned)) {
      toast({
        title: "Invalid domain",
        description: "Please enter a valid domain like portfolio.example.com",
        variant: "destructive",
      });
      return;
    }
    onChange(cleaned);
    setInputValue(cleaned);
    toast({ title: "Custom domain saved", description: `Set to ${cleaned}` });
  };

  const handleRemove = () => {
    setInputValue("");
    onChange(null);
    toast({ title: "Custom domain removed" });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const dnsRecords = [
    { type: "CNAME", name: customDomain || "your-domain.com", value: "folioai.lovable.app" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Custom Domain
        </h3>
        {customDomain && (
          <Badge variant="outline" className="text-xs">
            {isPublished ? (
            <span className="flex items-center gap-1 text-primary">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <AlertCircle className="w-3 h-3" /> Draft
              </span>
            )}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Domain Name</Label>
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="portfolio.yourdomain.com"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={cleanDomain(inputValue) === (customDomain || "")}
            >
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter your domain (e.g., portfolio.example.com or www.example.com)
          </p>
        </div>

        {customDomain && (
          <>
            {/* DNS Setup Instructions */}
            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                DNS Configuration Required
              </h4>
              <p className="text-xs text-muted-foreground">
                Add the following DNS record at your domain registrar to point your domain to your portfolio:
              </p>

              <div className="space-y-2">
                {dnsRecords.map((record, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[60px_1fr_1fr_32px] gap-2 items-center text-xs bg-background/50 rounded-md p-2 border border-border/50"
                  >
                    <Badge variant="outline" className="text-xs justify-center">
                      {record.type}
                    </Badge>
                    <code className="truncate text-muted-foreground">{record.name}</code>
                    <code className="truncate">{record.value}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(record.value, `dns-${i}`)}
                    >
                      {copied === `dns-${i}` ? (
                        <Check className="w-3 h-3 text-primary" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                DNS changes can take up to 48 hours to propagate.
              </p>
            </div>

            {/* Current URLs */}
            <div className="space-y-2">
              <Label className="text-xs">Your portfolio URLs</Label>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-md bg-secondary/30 border border-border/50">
                  <span className="text-muted-foreground truncate">
                    https://{customDomain}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(`https://${customDomain}`, "custom")}
                    >
                      {copied === "custom" ? (
                        <Check className="w-3 h-3 text-primary" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-secondary/30 border border-border/50">
                  <span className="text-muted-foreground truncate">
                    folioai.lovable.app/p/{username}
                  </span>
                  <span className="text-muted-foreground text-[10px] ml-2">fallback</span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleRemove}
            >
              Remove custom domain
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
