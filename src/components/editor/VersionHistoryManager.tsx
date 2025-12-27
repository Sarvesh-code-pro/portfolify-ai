import { useState } from "react";
import { History, RotateCcw, Undo, Redo, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PortfolioVersion, Portfolio } from "@/types/portfolio";
import { format } from "date-fns";

interface VersionHistoryManagerProps {
  versionHistory: PortfolioVersion[];
  currentPortfolio: Partial<Portfolio>;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRestore: (version: PortfolioVersion) => void;
  onSaveVersion: (label?: string) => void;
}

export function VersionHistoryManager({
  versionHistory,
  currentPortfolio,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onRestore,
  onSaveVersion,
}: VersionHistoryManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        Version History
      </h3>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSaveVersion()}
          className="ml-2"
        >
          <Clock className="w-4 h-4 mr-2" />
          Save Checkpoint
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <History className="w-4 h-4 mr-2" />
            View History ({versionHistory.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {versionHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No saved versions yet. Save checkpoints to restore later.
              </p>
            ) : (
              <div className="space-y-2">
                {[...versionHistory].reverse().map((version) => (
                  <div
                    key={version.id}
                    className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {version.label || "Auto-save"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(version.timestamp), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onRestore(version);
                        setDialogOpen(false);
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
