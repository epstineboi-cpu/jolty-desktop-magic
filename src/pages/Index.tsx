import { useEffect, useState } from "react";
import { Settings, Power, Wifi, Volume2, Battery, Store, Folder, Download, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type StoreApp = {
  id: string;
  name: string;
  developer: string;
  size: string;
  emoji: string;
  url: string;
  color: string;
};

const STORE_APPS: StoreApp[] = [
  {
    id: "baldi-classic",
    name: "Baldi's Basics Classic Remastered",
    developer: "Basically Games",
    size: "84 MB",
    emoji: "📐",
    url: "/apps/baldi-classic.html",
    color: "from-green-400 to-emerald-600",
  },
  {
    id: "baldi-plus",
    name: "Baldi's Basics Plus",
    developer: "Basically Games",
    size: "315 MB",
    emoji: "✏️",
    url: "/apps/baldi-plus.html",
    color: "from-amber-400 to-red-500",
  },
];

const PRESETS = [
  { name: "Google", url: "https://www.google.com/favicon.ico", title: "Google" },
  { name: "Classroom", url: "https://ssl.gstatic.com/classroom/favicon.png", title: "Classes" },
  { name: "Docs", url: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico", title: "Docs" },
  { name: "Khan Academy", url: "https://cdn.kastatic.org/images/favicon.ico", title: "Khan Academy" },
  { name: "Wikipedia", url: "https://en.wikipedia.org/static/favicon/wikipedia.ico", title: "Wikipedia" },
];

type InstallState = "idle" | "downloading" | "installed";

const Index = () => {
  const [time, setTime] = useState(new Date());
  const [openApps, setOpenApps] = useState<string[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [cloakTitle, setCloakTitle] = useState("");
  const [cloakIcon, setCloakIcon] = useState("");
  const [installs, setInstalls] = useState<Record<string, { state: InstallState; progress: number }>>(() => {
    const saved = localStorage.getItem("jolt-installs");
    if (saved) {
      const parsed = JSON.parse(saved);
      const out: Record<string, { state: InstallState; progress: number }> = {};
      Object.keys(parsed).forEach((k) => {
        out[k] = { state: parsed[k] ? "installed" : "idle", progress: parsed[k] ? 100 : 0 };
      });
      return out;
    }
    return {};
  });
  const [launchedApp, setLaunchedApp] = useState<StoreApp | null>(null);

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("jolt-cloak") || "{}");
    if (saved.title) {
      document.title = saved.title;
      setCloakTitle(saved.title);
    }
    if (saved.icon) {
      applyFavicon(saved.icon);
      setCloakIcon(saved.icon);
    }
  }, []);

  useEffect(() => {
    const persist: Record<string, boolean> = {};
    Object.keys(installs).forEach((k) => {
      persist[k] = installs[k].state === "installed";
    });
    localStorage.setItem("jolt-installs", JSON.stringify(persist));
  }, [installs]);

  const applyFavicon = (href: string) => {
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = href;
  };

  const applyCloak = (title: string, icon: string) => {
    if (title) document.title = title;
    if (icon) applyFavicon(icon);
    localStorage.setItem("jolt-cloak", JSON.stringify({ title, icon }));
  };

  const resetCloak = () => {
    localStorage.removeItem("jolt-cloak");
    setCloakTitle("");
    setCloakIcon("");
    document.title = "Jolt-OS";
    applyFavicon("/favicon.ico");
  };

  const openApp = (app: string) => {
    if (!openApps.includes(app)) setOpenApps([...openApps, app]);
    setActiveApp(app);
    setStartOpen(false);
  };

  const closeApp = (app: string) => {
    setOpenApps(openApps.filter((a) => a !== app));
    if (activeApp === app) setActiveApp(null);
  };

  const startInstall = (app: StoreApp) => {
    if (installs[app.id]?.state === "downloading") return;
    setInstalls((prev) => ({ ...prev, [app.id]: { state: "downloading", progress: 0 } }));
    const total = 3500 + Math.random() * 2000;
    const start = Date.now();
    const tick = () => {
      const pct = Math.min(100, ((Date.now() - start) / total) * 100);
      setInstalls((prev) => ({ ...prev, [app.id]: { state: pct >= 100 ? "installed" : "downloading", progress: pct } }));
      if (pct < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const installedApps = STORE_APPS.filter((a) => installs[a.id]?.state === "installed");

  return (
    <div className="relative h-screen w-screen overflow-hidden font-sans text-foreground">
      <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
        <source src="/wallpaper.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/30" />

      {/* Desktop icons */}
      <div className="absolute left-4 top-4 grid gap-3 z-10">
        <DesktopIcon label="Settings" onOpen={() => openApp("settings")} icon={<Settings className="h-8 w-8 text-white" />} />
        <DesktopIcon label="Jolt Store" onOpen={() => openApp("store")} icon={<Store className="h-8 w-8 text-white" />} />
        <DesktopIcon label="Files" onOpen={() => openApp("files")} icon={<Folder className="h-8 w-8 text-white" />} />
      </div>

      {/* Settings */}
      {openApps.includes("settings") && (
        <Window title="Settings" onClose={() => closeApp("settings")} onFocus={() => setActiveApp("settings")} active={activeApp === "settings"}>
          <div className="space-y-6 p-6">
            <section>
              <h2 className="mb-1 text-lg font-semibold">Tab Cloaking</h2>
              <p className="mb-4 text-sm text-muted-foreground">Disguise this tab's title and icon.</p>
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="title">Tab Title</Label>
                  <Input id="title" value={cloakTitle} onChange={(e) => setCloakTitle(e.target.value)} placeholder="Google" />
                </div>
                <div>
                  <Label htmlFor="icon">Favicon URL</Label>
                  <Input id="icon" value={cloakIcon} onChange={(e) => setCloakIcon(e.target.value)} placeholder="https://..." />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => applyCloak(cloakTitle, cloakIcon)}>Apply</Button>
                  <Button variant="outline" onClick={resetCloak}>Reset</Button>
                </div>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">Presets</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <Button key={p.name} variant="secondary" size="sm" onClick={() => { setCloakTitle(p.title); setCloakIcon(p.url); applyCloak(p.title, p.url); }}>
                      <img src={p.url} alt="" className="mr-2 h-4 w-4" />
                      {p.name}
                    </Button>
                  ))}
                </div>
              </div>
            </section>
            <section>
              <h2 className="mb-1 text-lg font-semibold">About</h2>
              <p className="text-sm text-muted-foreground">Jolt-OS v1.1 — built with bolt energy ⚡</p>
            </section>
          </div>
        </Window>
      )}

      {/* Jolt Store */}
      {openApps.includes("store") && (
        <Window title="Jolt Store" onClose={() => closeApp("store")} onFocus={() => setActiveApp("store")} active={activeApp === "store"} wide>
          <div className="bg-gradient-to-b from-background/40 to-background p-6">
            <div className="mb-6 flex items-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Jolt Store</h2>
                <p className="text-sm text-muted-foreground">Discover & install apps</p>
              </div>
            </div>
            <div className="space-y-4">
              {STORE_APPS.map((app) => {
                const st = installs[app.id];
                const state = st?.state ?? "idle";
                return (
                  <div key={app.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${app.color} text-3xl shadow-lg`}>
                      {app.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{app.name}</p>
                      <p className="text-xs text-muted-foreground">{app.developer} • {app.size}</p>
                      {state === "downloading" && (
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={st.progress} className="h-1.5 flex-1" />
                          <span className="text-xs tabular-nums text-muted-foreground">{Math.floor(st.progress)}%</span>
                        </div>
                      )}
                    </div>
                    <AppleInstallButton state={state} progress={st?.progress ?? 0} onGet={() => startInstall(app)} onOpen={() => setLaunchedApp(app)} />
                  </div>
                );
              })}
            </div>
          </div>
        </Window>
      )}

      {/* Files */}
      {openApps.includes("files") && (
        <Window title="Files" onClose={() => closeApp("files")} onFocus={() => setActiveApp("files")} active={activeApp === "files"}>
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Folder className="h-5 w-5" />
              <span className="text-sm text-muted-foreground">Downloads</span>
            </div>
            {installedApps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 p-10 text-center text-sm text-muted-foreground">
                No downloads yet. Visit the Jolt Store to install apps.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {installedApps.map((app) => (
                  <button key={app.id} onClick={() => setLaunchedApp(app)} className="group flex flex-col items-center gap-2 rounded-xl p-3 text-center hover:bg-white/10">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${app.color} text-3xl shadow-md transition-transform group-hover:scale-105`}>
                      {app.emoji}
                    </div>
                    <span className="line-clamp-2 text-xs">{app.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Window>
      )}

      {/* Launched app fullscreen */}
      {launchedApp && (
        <div className="absolute inset-0 z-40 flex flex-col bg-black">
          <div className="flex h-9 items-center justify-between border-b border-white/10 bg-background/80 px-3 backdrop-blur">
            <span className="text-sm font-medium">{launchedApp.name}</span>
            <button onClick={() => setLaunchedApp(null)} className="flex h-6 w-6 items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground">✕</button>
          </div>
          <iframe src={launchedApp.url} title={launchedApp.name} className="flex-1 border-0" />
        </div>
      )}

      {/* Start menu */}
      {startOpen && (
        <div className="absolute bottom-14 left-2 z-30 w-72 rounded-lg border border-white/20 bg-background/80 p-3 shadow-2xl backdrop-blur-xl">
          <p className="mb-2 px-2 text-xs uppercase tracking-wider text-muted-foreground">Pinned</p>
          <StartItem icon={<Settings className="h-5 w-5" />} label="Settings" onClick={() => openApp("settings")} />
          <StartItem icon={<Store className="h-5 w-5" />} label="Jolt Store" onClick={() => openApp("store")} />
          <StartItem icon={<Folder className="h-5 w-5" />} label="Files" onClick={() => openApp("files")} />
          <div className="mt-3 border-t border-white/10 pt-2">
            <StartItem icon={<Power className="h-5 w-5" />} label="Restart" onClick={() => location.reload()} />
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex h-12 items-center justify-between border-t border-white/20 bg-background/60 px-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button onClick={() => setStartOpen(!startOpen)} className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10" aria-label="Start">
            <div className="text-xl font-black bg-gradient-to-br from-yellow-300 to-purple-500 bg-clip-text text-transparent">⚡</div>
          </button>
          {openApps.map((app) => (
            <button key={app} onClick={() => setActiveApp(app)} className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm capitalize hover:bg-white/10 ${activeApp === app ? "bg-white/20" : ""}`}>
              {app === "settings" && <Settings className="h-4 w-4" />}
              {app === "store" && <Store className="h-4 w-4" />}
              {app === "files" && <Folder className="h-4 w-4" />}
              {app}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 px-2 text-xs text-white">
          <Wifi className="h-4 w-4" />
          <Volume2 className="h-4 w-4" />
          <Battery className="h-4 w-4" />
          <div className="text-right leading-tight">
            <div>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            <div>{time.toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppleInstallButton = ({
  state,
  progress,
  onGet,
  onOpen,
}: {
  state: InstallState;
  progress: number;
  onGet: () => void;
  onOpen: () => void;
}) => {
  if (state === "installed") {
    return (
      <button onClick={onOpen} className="flex h-8 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition active:scale-95">
        <Play className="h-3.5 w-3.5 fill-current" /> OPEN
      </button>
    );
  }
  if (state === "downloading") {
    return (
      <div className="relative h-8 w-8">
        <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" className="fill-none stroke-muted" strokeWidth="2" />
          <circle
            cx="16"
            cy="16"
            r="13"
            className="fill-none stroke-primary transition-all"
            strokeWidth="2"
            strokeDasharray={`${(progress / 100) * 81.68} 81.68`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-sm bg-primary" />
        </div>
      </div>
    );
  }
  return (
    <button onClick={onGet} className="flex h-8 items-center gap-1.5 rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground shadow-sm transition hover:bg-secondary/80 active:scale-95">
      <Download className="h-3.5 w-3.5" /> GET
    </button>
  );
};

const StartItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button onClick={onClick} className="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-white/10">
    {icon}<span>{label}</span>
  </button>
);

const DesktopIcon = ({ label, icon, onOpen }: { label: string; icon: React.ReactNode; onOpen: () => void }) => (
  <button onDoubleClick={onOpen} onClick={onOpen} className="flex w-20 flex-col items-center gap-1 rounded p-2 text-center text-xs text-white hover:bg-white/10">
    {icon}
    <span className="drop-shadow-md">{label}</span>
  </button>
);

const Window = ({
  title,
  children,
  onClose,
  onFocus,
  active,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onFocus: () => void;
  active: boolean;
  wide?: boolean;
}) => (
  <div
    onMouseDown={onFocus}
    className={`absolute left-1/2 top-1/2 z-20 ${wide ? "w-[760px]" : "w-[640px]"} max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-white/20 bg-background/90 shadow-2xl backdrop-blur-xl ${active ? "ring-1 ring-white/30" : ""}`}
  >
    <div className="flex h-9 items-center justify-between border-b border-white/10 bg-background/50 px-3">
      <span className="text-sm font-medium">{title}</span>
      <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground">✕</button>
    </div>
    <div className="max-h-[72vh] overflow-y-auto">{children}</div>
  </div>
);

export default Index;
