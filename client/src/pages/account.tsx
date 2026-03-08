import { useState } from "react";
import { getUserName, setUserName } from "@/lib/store";
import { Check } from "lucide-react";

export default function AccountPage() {
  const [name, setName] = useState(getUserName());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setUserName(name.trim() || "Student");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="max-w-md">
        <h1 className="text-lg font-semibold text-foreground mb-1" data-testid="text-account-title">Account Settings</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage your profile and preferences.</p>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Display Name</label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                data-testid="input-name"
              />
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                data-testid="button-save-name"
              >
                {saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : "Change"}
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Personality Tags</h2>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground" data-testid="button-add-mbti">
                + Add MBTI
              </button>
              <button className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground" data-testid="button-add-star">
                + Add Star Signs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
