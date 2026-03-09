import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Check } from "lucide-react";

export default function AccountPage() {
  const { user, updateName } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await updateName(name.trim() || "Student");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-auto p-5 sm:p-8">
      <div className="max-w-md">
        <h1 className="font-display text-xl font-bold text-foreground mb-1" data-testid="text-account-title">Account Settings</h1>
        <p className="text-sm text-muted-foreground mb-8">Manage your profile and preferences.</p>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5">
            <label className="block text-xs font-medium text-muted-foreground mb-2">Display Name</label>
            <div className="flex gap-2.5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-xl border border-border/60 bg-white px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                data-testid="input-name"
              />
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                data-testid="button-save-name"
              >
                {saved ? <><Check className="h-4 w-4" /> Saved</> : "Save"}
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <label className="block text-xs font-medium text-muted-foreground mb-2">Email</label>
            <p className="text-sm text-foreground" data-testid="text-email">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
