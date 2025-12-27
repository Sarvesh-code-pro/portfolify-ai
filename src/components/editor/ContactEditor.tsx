import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ContactSettings } from "@/types/portfolio";

interface ContactEditorProps {
  contactSettings: ContactSettings;
  onChange: (settings: ContactSettings) => void;
}

export function ContactEditor({ contactSettings, onChange }: ContactEditorProps) {
  const updateSettings = (updates: Partial<ContactSettings>) => {
    onChange({ ...contactSettings, ...updates });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        Contact Settings
      </h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Email Address</Label>
          <Input
            type="email"
            value={contactSettings.email || ""}
            onChange={(e) => updateSettings({ email: e.target.value || null })}
            placeholder="your@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label>WhatsApp Number</Label>
          <Input
            type="tel"
            value={contactSettings.whatsapp || ""}
            onChange={(e) => updateSettings({ whatsapp: e.target.value || null })}
            placeholder="+1234567890"
          />
          <p className="text-xs text-muted-foreground">Include country code</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Show Contact Form</Label>
            <p className="text-xs text-muted-foreground">
              Let visitors send you messages
            </p>
          </div>
          <Switch
            checked={contactSettings.show_form}
            onCheckedChange={(checked) => updateSettings({ show_form: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Sticky Contact Button</Label>
            <p className="text-xs text-muted-foreground">
              Always visible "Contact Me" button
            </p>
          </div>
          <Switch
            checked={contactSettings.sticky_button}
            onCheckedChange={(checked) => updateSettings({ sticky_button: checked })}
          />
        </div>
      </div>
    </div>
  );
}
