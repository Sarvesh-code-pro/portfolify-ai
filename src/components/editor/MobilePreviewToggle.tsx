import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeviceType = "desktop" | "tablet" | "mobile";

interface MobilePreviewToggleProps {
  device: DeviceType;
  onChange: (device: DeviceType) => void;
}

export function MobilePreviewToggle({ device, onChange }: MobilePreviewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
      <Button
        variant={device === "desktop" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onChange("desktop")}
        title="Desktop view"
      >
        <Monitor className="w-4 h-4" />
      </Button>
      <Button
        variant={device === "tablet" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onChange("tablet")}
        title="Tablet view"
      >
        <Tablet className="w-4 h-4" />
      </Button>
      <Button
        variant={device === "mobile" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onChange("mobile")}
        title="Mobile view"
      >
        <Smartphone className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function getDeviceWidth(device: DeviceType): string {
  switch (device) {
    case "mobile":
      return "375px";
    case "tablet":
      return "768px";
    default:
      return "100%";
  }
}
