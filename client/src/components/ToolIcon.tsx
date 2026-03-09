import type { ToolType } from "@shared/schema";
import { SiGoogledrive, SiNotion, SiGithub, SiFigma, SiDropbox, SiConfluence, SiSlack, SiJira, SiLoom, SiAirtable } from "react-icons/si";
import { Link2 } from "lucide-react";

const TOOL_META: Record<ToolType, { label: string; color: string }> = {
  gdrive: { label: "Google Drive", color: "#4285F4" },
  notion: { label: "Notion", color: "#000000" },
  github: { label: "GitHub", color: "#24292e" },
  figma: { label: "Figma", color: "#F24E1E" },
  dropbox: { label: "Dropbox", color: "#0061FF" },
  confluence: { label: "Confluence", color: "#2684FF" },
  slack: { label: "Slack", color: "#4A154B" },
  jira: { label: "Jira", color: "#0052CC" },
  loom: { label: "Loom", color: "#625DF5" },
  airtable: { label: "Airtable", color: "#18BFFF" },
  other: { label: "Link", color: "#6B7280" },
};

const TOOL_ICONS: Record<ToolType, typeof SiGithub | typeof Link2> = {
  gdrive: SiGoogledrive,
  notion: SiNotion,
  github: SiGithub,
  figma: SiFigma,
  dropbox: SiDropbox,
  confluence: SiConfluence,
  slack: SiSlack,
  jira: SiJira,
  loom: SiLoom,
  airtable: SiAirtable,
  other: Link2,
};

export function getToolMeta(tool: ToolType) {
  return TOOL_META[tool];
}

export function getToolList(): ToolType[] {
  return ["gdrive", "notion", "github", "figma", "dropbox", "confluence", "slack", "jira", "loom", "airtable"];
}

export default function ToolIcon({ tool, size = 16, className = "" }: { tool: ToolType; size?: number; className?: string }) {
  const Icon = TOOL_ICONS[tool];
  const meta = TOOL_META[tool];
  return <Icon size={size} style={{ color: meta.color }} className={className} />;
}
