import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import {
  getProject, addDocument, removeDocument, removeMember, updateMemberTags,
  updateChannels, updateChannelLink, addActionItem, removeActionItem
} from "@/lib/store";
import type { ChannelEntry, Milestone } from "@shared/schema";
import TimelineWidget from "@/components/TimelineWidget";
import ToolIcon, { getToolMeta, getToolList } from "@/components/ToolIcon";
import {
  FileText, Calendar, Users, Upload, Loader2, AlertCircle, X, BookOpen,
  Plus, ExternalLink, Copy, Check, Trash2, Link2, MessageCircle, Settings, ArrowRight, Image, Zap
} from "lucide-react";
import {
  SiWhatsapp, SiLine, SiKakaotalk, SiWechat, SiInstagram,
  SiSlack, SiDiscord, SiTelegram, SiZoom,
  SiGooglemeet, SiLoom, SiMessenger
} from "react-icons/si";
import type { IconType } from "react-icons";

const BUILTIN_APPS: { key: string; label: string; icon: IconType | null; color: string }[] = [
  { key: "slack", label: "Slack", icon: SiSlack, color: "#4A154B" },
  { key: "discord", label: "Discord", icon: SiDiscord, color: "#5865F2" },
  { key: "teams", label: "Microsoft Teams", icon: null, color: "#6264A7" },
  { key: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, color: "#25D366" },
  { key: "telegram", label: "Telegram", icon: SiTelegram, color: "#26A5E4" },
  { key: "email", label: "Email", icon: null, color: "#6366F1" },
  { key: "zoom", label: "Zoom", icon: SiZoom, color: "#0B5CFF" },
  { key: "googlemeet", label: "Google Meet", icon: SiGooglemeet, color: "#00897B" },
  { key: "loom", label: "Loom", icon: SiLoom, color: "#625DF5" },
  { key: "line", label: "Line", icon: SiLine, color: "#06C755" },
  { key: "instagram", label: "Instagram", icon: SiInstagram, color: "#E4405F" },
  { key: "wechat", label: "WeChat", icon: SiWechat, color: "#07C160" },
  { key: "kakaotalk", label: "KakaoTalk", icon: SiKakaotalk, color: "#FFE812" },
  { key: "messenger", label: "Messenger", icon: SiMessenger, color: "#0084FF" },
  { key: "imessage", label: "iMessage", icon: null, color: "#34C759" },
];

function ChannelIcon({ appKey, color, iconUrl, size = 24 }: { appKey: string; color: string; iconUrl?: string; size?: number }) {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        className="rounded"
        style={{ width: size, height: size }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  const builtin = BUILTIN_APPS.find((a) => a.key === appKey);
  if (builtin?.icon) {
    const Icon = builtin.icon;
    return <Icon style={{ color, width: size, height: size }} />;
  }
  if (appKey === "email") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    );
  }
  if (appKey === "imessage") {
    return <MessageCircle style={{ color, width: size, height: size }} />;
  }
  if (appKey === "teams") {
    return (
      <svg viewBox="0 0 24 24" style={{ width: size, height: size }} fill="none">
        <rect width="24" height="24" rx="4" fill={color} />
        <text x="12" y="17" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">T</text>
      </svg>
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-lg text-white font-bold"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.45 }}
    >
      {appKey.charAt(0).toUpperCase()}
    </div>
  );
}

function ChannelPickerModal({
  selected,
  onSave,
  onClose,
}: {
  selected: ChannelEntry[];
  onSave: (channels: ChannelEntry[]) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set(selected.map((c) => c.appKey)));
  const [customApps, setCustomApps] = useState<{ key: string; label: string; iconUrl?: string }[]>(
    selected.filter((c) => !BUILTIN_APPS.some((b) => b.key === c.appKey)).map((c) => ({ key: c.appKey, label: c.label, iconUrl: c.iconUrl }))
  );
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customIconUrl, setCustomIconUrl] = useState("");

  const toggle = (key: string) => {
    const next = new Set(picked);
    if (next.has(key)) next.delete(key); else next.add(key);
    setPicked(next);
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    const key = "custom_" + customName.trim().toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    setCustomApps([...customApps, { key, label: customName.trim(), iconUrl: customIconUrl.trim() || undefined }]);
    setPicked(new Set([...picked, key]));
    setCustomName("");
    setCustomIconUrl("");
    setAddingCustom(false);
  };

  const handleSave = () => {
    const channels: ChannelEntry[] = [];
    picked.forEach((key) => {
      const existing = selected.find((c) => c.appKey === key);
      const builtin = BUILTIN_APPS.find((a) => a.key === key);
      const custom = customApps.find((a) => a.key === key);
      if (builtin) {
        channels.push({ appKey: key, label: builtin.label, link: existing?.link });
      } else if (custom) {
        channels.push({ appKey: key, label: custom.label, iconUrl: custom.iconUrl, link: existing?.link });
      }
    });
    onSave(channels);
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" style={{ zIndex: 9999 }} onClick={onClose} data-testid="modal-channel-picker">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <h2 className="font-display text-base font-semibold text-foreground">Set Up Channels</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-close-modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {BUILTIN_APPS.map((app) => {
              const isSelected = picked.has(app.key);
              return (
                <button
                  key={app.key}
                  onClick={() => toggle(app.key)}
                  className={`relative flex flex-col items-center gap-2 rounded-xl p-3 transition-all border-2 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/30 bg-white hover:border-border/60 hover:shadow-sm"
                  }`}
                  data-testid={`picker-${app.key}`}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  <ChannelIcon appKey={app.key} color={app.color} size={28} />
                  <span className="text-[11px] font-medium text-foreground text-center leading-tight">{app.label}</span>
                </button>
              );
            })}

            {customApps.map((app) => {
              const isSelected = picked.has(app.key);
              return (
                <button
                  key={app.key}
                  onClick={() => toggle(app.key)}
                  className={`relative flex flex-col items-center gap-2 rounded-xl p-3 transition-all border-2 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/30 bg-white hover:border-border/60 hover:shadow-sm"
                  }`}
                  data-testid={`picker-custom-${app.key}`}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  <ChannelIcon appKey={app.key} color="#8B5CF6" iconUrl={app.iconUrl} size={28} />
                  <span className="text-[11px] font-medium text-foreground text-center leading-tight">{app.label}</span>
                </button>
              );
            })}

            {addingCustom ? (
              <div className="col-span-full rounded-xl border-2 border-dashed border-border/60 p-4 space-y-3">
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
                  placeholder="App name"
                  className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  data-testid="input-custom-name"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    value={customIconUrl}
                    onChange={(e) => setCustomIconUrl(e.target.value)}
                    placeholder="Logo URL (optional)"
                    className="flex-1 rounded-lg border border-border/60 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    data-testid="input-custom-icon"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={addCustom} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground" data-testid="button-save-custom">Add</button>
                  <button onClick={() => setAddingCustom(false)} className="text-xs text-muted-foreground">Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingCustom(true)}
                className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 border-2 border-dashed border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                data-testid="button-add-custom-app"
              >
                <Plus className="h-6 w-6" />
                <span className="text-[11px] font-medium text-center leading-tight">Custom App</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/40">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            data-testid="button-save-channels"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CommunicationChannels({ project, onUpdate }: { project: any; onUpdate: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [linkValue, setLinkValue] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);

  const projectChannels: ChannelEntry[] = project.channels || [];

  const handleSaveChannels = async (newChannels: ChannelEntry[]) => {
    await updateChannels(project.id, newChannels);
    setShowModal(false);
    onUpdate();
  };

  const handleSaveLink = async (appKey: string) => {
    await updateChannelLink(project.id, appKey, linkValue.trim());
    setEditingLink(null);
    setLinkValue("");
    onUpdate();
  };

  const startEditLink = (ch: ChannelEntry) => {
    setEditingLink(ch.appKey);
    setLinkValue(ch.link || "");
    setTimeout(() => linkInputRef.current?.focus(), 50);
  };

  return (
    <div className="glass-card rounded-2xl p-5" data-testid="widget-channels">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Communication Channels
        </h3>
        {projectChannels.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="text-muted-foreground hover:text-primary transition-colors"
            data-testid="button-edit-channels"
            title="Edit channels"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>

      {projectChannels.length === 0 ? (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 bg-white/60 px-4 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-all w-full justify-center"
          data-testid="button-setup-channels"
        >
          <Plus className="h-4 w-4" />
          Set Up Channels
        </button>
      ) : (
        <div className="flex flex-wrap gap-3">
          {projectChannels.map((ch) => {
            const builtin = BUILTIN_APPS.find((a) => a.key === ch.appKey);
            const color = builtin?.color || "#8B5CF6";
            return (
              <div key={ch.appKey} className="flex flex-col items-center gap-1.5 w-[76px]" data-testid={`channel-${ch.appKey}`}>
                <button
                  onClick={() => startEditLink(ch)}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-white/60 border border-border/30 p-3 w-full transition-all hover:shadow-sm hover:border-primary/30"
                  data-testid={`channel-icon-${ch.appKey}`}
                >
                  <ChannelIcon appKey={ch.appKey} color={color} iconUrl={ch.iconUrl} size={24} />
                  <span className="text-[10px] text-muted-foreground text-center leading-tight truncate w-full">{ch.label}</span>
                </button>
                {editingLink === ch.appKey ? (
                  <div className="w-full space-y-1">
                    <input
                      ref={linkInputRef}
                      value={linkValue}
                      onChange={(e) => setLinkValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveLink(ch.appKey); if (e.key === "Escape") setEditingLink(null); }}
                      placeholder="Link or handle..."
                      className="w-full rounded-lg border border-border/60 bg-white px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/30"
                      data-testid={`input-link-${ch.appKey}`}
                    />
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => handleSaveLink(ch.appKey)} className="text-primary"><Check className="h-3 w-3" /></button>
                      <button onClick={() => setEditingLink(null)} className="text-muted-foreground"><X className="h-3 w-3" /></button>
                    </div>
                  </div>
                ) : ch.link ? (
                  <a
                    href={ch.link.startsWith("http") ? ch.link : `https://${ch.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80 transition-colors"
                    data-testid={`link-open-${ch.appKey}`}
                  >
                    Open <ArrowRight className="h-2.5 w-2.5" />
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ChannelPickerModal
          selected={projectChannels}
          onSave={handleSaveChannels}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function ProgressBar({ milestones }: { milestones: any[] }) {
  if (milestones.length === 0) return null;
  const completed = milestones.filter((m: any) => new Date(m.date + "T23:59:59") < new Date()).length;
  const pct = Math.round((completed / milestones.length) * 100);

  return (
    <div className="flex items-center gap-3 flex-1 max-w-xs">
      <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
    </div>
  );
}

function InviteButton({ project }: { project: any }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/invite/${project.inviteToken}`;

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copyInvite}
      className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-white px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
      data-testid="button-copy-invite"
      title={inviteUrl}
    >
      {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Link2 className="h-3.5 w-3.5" /> Invite</>}
    </button>
  );
}

function PeopleSection({ project, onUpdate }: { project: any; onUpdate: () => void }) {
  const [addingTag, setAddingTag] = useState<number | null>(null);
  const [newTag, setNewTag] = useState("");

  const members: { userId: number; name: string; email: string; tags: string[] }[] = project.members || [];

  const handleRemoveMember = async (userId: number) => {
    await removeMember(project.id, userId);
    onUpdate();
  };

  const handleAddTag = async (userId: number) => {
    if (!newTag.trim()) return;
    const member = members.find((m) => m.userId === userId);
    if (!member) return;
    await updateMemberTags(project.id, userId, [...member.tags, newTag.trim()]);
    setNewTag("");
    setAddingTag(null);
    onUpdate();
  };

  const handleRemoveTag = async (userId: number, tag: string) => {
    const member = members.find((m) => m.userId === userId);
    if (!member) return;
    await updateMemberTags(project.id, userId, member.tags.filter((t) => t !== tag));
    onUpdate();
  };

  return (
    <div className="glass-card rounded-2xl p-5" data-testid="widget-people">
      <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        People
      </h3>
      {members.length === 0 ? (
        <p className="text-xs text-muted-foreground">No members yet. Share the invite link to add people.</p>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.userId} className="flex items-start gap-3 group" data-testid={`member-${m.userId}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary shrink-0 mt-0.5">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                  <button
                    onClick={() => handleRemoveMember(m.userId)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all ml-auto"
                    data-testid={`button-remove-member-${m.userId}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {m.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-medium group/tag"
                      data-testid={`tag-${m.userId}-${tag}`}
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(m.userId, tag)}
                        className="opacity-0 group-hover/tag:opacity-100 transition-opacity"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  {addingTag === m.userId ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddTag(m.userId); if (e.key === "Escape") setAddingTag(null); }}
                        placeholder="Tag..."
                        className="w-20 rounded-full border border-border/60 bg-white px-2.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/30"
                        data-testid={`input-tag-${m.userId}`}
                        autoFocus
                      />
                      <button onClick={() => handleAddTag(m.userId)} className="text-primary"><Check className="h-3 w-3" /></button>
                      <button onClick={() => setAddingTag(null)} className="text-muted-foreground"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingTag(m.userId); setNewTag(""); }}
                      className="rounded-full border border-dashed border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                      data-testid={`button-add-tag-${m.userId}`}
                    >
                      + tag
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentsWidget({ project, onUpdate }: { project: any; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [selectedTool, setSelectedTool] = useState<string>("other");

  const handleAdd = async () => {
    if (!url.trim()) return;
    await addDocument(project.id, {
      label: label.trim() || url.trim(),
      url: url.trim(),
      tool: selectedTool,
    });
    setLabel("");
    setUrl("");
    setSelectedTool("other");
    setAdding(false);
    onUpdate();
  };

  const handleRemove = async (docId: number) => {
    await removeDocument(project.id, docId);
    onUpdate();
  };

  const toolList = getToolList();
  const docs = project.documents || [];

  return (
    <div className="glass-card rounded-2xl p-5" data-testid="widget-docs">
      <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        Documents
      </h3>

      {docs.length > 0 && (
        <div className="space-y-2 mb-3">
          {docs.map((doc: any) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-xl bg-white/60 border border-border/30 p-3 group transition-all hover:shadow-sm" data-testid={`doc-${doc.id}`}>
              <ToolIcon tool={doc.tool} size={18} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate block">{doc.label}</span>
              </div>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors" data-testid={`link-doc-${doc.id}`}>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => handleRemove(doc.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                data-testid={`button-remove-doc-${doc.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="space-y-3 rounded-xl border border-border/40 bg-white/60 p-4">
          <div className="flex flex-wrap gap-1.5">
            {toolList.map((tool) => {
              const meta = getToolMeta(tool);
              return (
                <button
                  key={tool}
                  onClick={() => setSelectedTool(tool)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all border ${
                    selectedTool === tool
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : "border-transparent bg-white text-muted-foreground hover:bg-muted/40"
                  }`}
                  data-testid={`button-tool-${tool}`}
                  title={meta.label}
                >
                  <ToolIcon tool={tool} size={14} />
                  <span className="hidden sm:inline">{meta.label}</span>
                </button>
              );
            })}
          </div>

          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Project Repo)"
            className="w-full rounded-xl border border-border/60 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            data-testid="input-doc-label"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="https://..."
            className="w-full rounded-xl border border-border/60 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            data-testid="input-doc-url"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:shadow-sm" data-testid="button-save-doc">Add</button>
            <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          data-testid="button-add-doc"
        >
          <Plus className="h-3.5 w-3.5" /> Add document link
        </button>
      )}
    </div>
  );
}

function ProjectActionItems({ project, onUpdate }: { project: any; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    await addActionItem(project.id, newItem.trim());
    setNewItem("");
    setAdding(false);
    onUpdate();
  };

  const handleRemove = async (itemId: number) => {
    await removeActionItem(project.id, itemId);
    onUpdate();
  };

  const items: { id: number; text: string }[] = project.actionItems || [];

  return (
    <div className="glass-card rounded-2xl p-5" data-testid="widget-project-actions">
      <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-500" />
        Action Items
      </h3>

      {items.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Zap className="h-7 w-7 text-muted-foreground/20 mb-2" />
          <p className="text-xs text-muted-foreground mb-3">No action items yet</p>
        </div>
      ) : (
        <div className="space-y-1 mb-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2.5 rounded-xl p-2.5 group transition-colors hover:bg-white/60"
              data-testid={`project-action-${item.id}`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p className="flex-1 text-sm text-foreground min-w-0">{item.text}</p>
              <button
                onClick={() => handleRemove(item.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                data-testid={`button-remove-action-${item.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setNewItem(""); } }}
            placeholder="New action item..."
            className="flex-1 rounded-xl border border-border/60 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            data-testid="input-project-action"
            autoFocus
          />
          <button onClick={handleAdd} className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:shadow-sm" data-testid="button-save-action">Add</button>
          <button onClick={() => { setAdding(false); setNewItem(""); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          data-testid="button-add-action"
        >
          <Plus className="h-3.5 w-3.5" /> Add action item
        </button>
      )}
    </div>
  );
}

interface ProjectDetailProps {
  projectId: number;
  refreshKey: number;
  onProjectUpdated: () => void;
}

export default function ProjectDetail({ projectId, refreshKey, onProjectUpdated }: ProjectDetailProps) {
  const [, navigate] = useLocation();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const fetchProject = async () => {
    setLoading(true);
    const data = await getProject(projectId);
    setProject(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
  }, [projectId, refreshKey]);

  useEffect(() => {
    const evtSource = new EventSource(`/api/projects/${projectId}/events`, { withCredentials: true });
    evtSource.addEventListener("action_item_added", () => fetchProject());
    evtSource.addEventListener("action_item_removed", () => fetchProject());
    evtSource.addEventListener("document_added", () => fetchProject());
    evtSource.addEventListener("document_removed", () => fetchProject());
    evtSource.addEventListener("channels_updated", () => fetchProject());
    evtSource.addEventListener("member_joined", () => fetchProject());
    evtSource.addEventListener("member_removed", () => fetchProject());
    evtSource.addEventListener("tags_updated", () => fetchProject());
    evtSource.addEventListener("deadlines_updated", () => fetchProject());
    return () => evtSource.close();
  }, [projectId]);

  const refresh = () => {
    fetchProject();
    onProjectUpdated();
  };

  const handleAnalyze = async () => {
    setError("");
    setAnalyzing(true);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else if (pastedText.trim()) {
        formData.append("text", pastedText.trim());
      } else {
        setError("Upload a PDF or paste text.");
        setAnalyzing(false);
        return;
      }

      const res = await fetch(`/api/projects/${projectId}/analyze-syllabus`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const json = await res.json();

      if (json.success) {
        setShowUpload(false);
        setFile(null);
        setPastedText("");
        refresh();
      } else {
        setError(json.error || "Analysis failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  const milestones: Milestone[] = (project.deadlines || []).map((d: any) => ({
    id: d.milestoneId || String(d.id),
    title: d.title,
    description: d.description || "",
    date: d.date,
    type: d.type,
    weight: d.weight,
    tips: d.tips,
  }));

  return (
    <div className="flex-1 overflow-auto" data-testid="project-detail">
      <div className="border-b border-border/40 bg-white/60 backdrop-blur-sm px-5 sm:px-8 py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-foreground truncate" data-testid="text-project-name">{project.name}</h1>
            <ProgressBar milestones={milestones} />
          </div>
          <div className="flex items-center gap-2">
            <InviteButton project={project} />
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-white px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              data-testid="button-upload-syllabus"
            >
              <Upload className="h-3.5 w-3.5" />
              {milestones.length > 0 ? "Re-upload Syllabus" : "Upload Syllabus"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-8 space-y-5">
        {showUpload && (
          <div className="glass-card rounded-2xl p-5" data-testid="upload-panel">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-semibold text-foreground">Upload Syllabus</h3>
              <button onClick={() => { setShowUpload(false); setError(""); }} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-close-upload">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!pasteMode ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-white/60 p-5 mb-3">
                {file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm text-foreground truncate">{file.name}</span>
                    </div>
                    <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer py-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Drop PDF or <span className="text-primary font-medium">browse</span></span>
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        if (f.type !== "application/pdf") { setError("PDF only"); return; }
                        if (f.size > 10 * 1024 * 1024) { setError("Max 10MB"); return; }
                        setFile(f); setError("");
                      }
                    }} data-testid="input-file-detail" />
                  </label>
                )}
              </div>
            ) : (
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste syllabus text (min 200 chars)..."
                className="w-full min-h-[100px] rounded-xl border border-border/60 bg-white p-4 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                data-testid="input-paste-detail"
              />
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => { setPasteMode(!pasteMode); setFile(null); setPastedText(""); }}
                className="text-xs text-muted-foreground flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                {pasteMode ? <><Upload className="h-3 w-3" /> File upload</> : <><BookOpen className="h-3 w-3" /> Paste text</>}
              </button>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || (!file && (!pasteMode || pastedText.trim().length < 200))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-40 transition-all hover:shadow-md active:scale-[0.98]"
                data-testid="button-analyze"
              >
                {analyzing ? <><Loader2 className="h-3 w-3 animate-spin" /> Analyzing...</> : "Analyze"}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 mt-3 rounded-xl bg-destructive/5 border border-destructive/15 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PeopleSection project={project} onUpdate={refresh} />
          <CommunicationChannels project={project} onUpdate={refresh} />
        </div>

        <DocumentsWidget project={project} onUpdate={refresh} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 glass-card rounded-2xl p-5" data-testid="widget-timeline">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Timeline
            </h3>
            <TimelineWidget
              milestones={milestones}
              summary={project.summary}
              onRegenerate={() => setShowUpload(true)}
              isRegenerating={analyzing}
            />
          </div>

          <div className="lg:col-span-2">
            <ProjectActionItems project={project} onUpdate={refresh} />
          </div>
        </div>
      </div>
    </div>
  );
}
