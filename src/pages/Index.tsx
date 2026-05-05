import { useEffect, useRef, useState, useCallback } from "react";
import {
  Settings,
  Power,
  Wifi,
  Volume2,
  Battery,
  Store,
  Folder,
  Download,
  Play,
  Minus,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  Sparkles,
  Search,
  Star,
  HardDrive,
  FileCog,
  Music,
  Image as ImageIcon,
  Palette,
  Monitor,
  Info,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import cloverPitImg from "@/assets/clover-pit.png";
import biteFreddyImg from "@/assets/bite-freddy.png";

// Resolve a public-folder asset relative to the deployed base. Works in dev (/),
// production (/), and offline file:// (./) builds.
const asset = (p: string) => {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/${p.replace(/^\//, "")}`;
};

type StoreApp = {
  id: string;
  name: string;
  developer: string;
  size: string;
  image: string;
  url: string;
  tagline: string;
  rating: number;
  accent: string;
};

const STORE_APPS: StoreApp[] = [
  {
    id: "clover-pit",
    name: "Clover Pit",
    developer: "Panik Arcade",
    size: "87 MB",
    image: cloverPitImg,
    url: asset("apps/clover-pit.html"),
    tagline: "Pull the lever. Pray the reels are kind.",
    rating: 4.8,
    accent: "from-rose-500 via-red-600 to-amber-500",
  },
  {
    id: "bite-freddy",
    name: "A Bite at Freddy's",
    developer: "FNaF Fan Studio",
    size: "120 MB",
    image: biteFreddyImg,
    url: asset("apps/bite-freddy.html"),
    tagline: "Survive the night shift. Don't get bitten.",
    rating: 4.6,
    accent: "from-amber-700 via-red-800 to-zinc-900",
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
type AppId = "settings" | "store" | "files";

type WindowState = {
  minimized: boolean;
  maximized: boolean;
  x: number;
  y: number;
};

const SYSTEM_FILES = [
  { name: "kernel.sys", size: "4.2 MB", type: "system", icon: FileCog },
  { name: "boot.cfg", size: "12 KB", type: "config", icon: FileCog },
  { name: "jolt-shell.exe", size: "8.1 MB", type: "system", icon: HardDrive },
  { name: "wallpaper.mp4", size: "18.4 MB", type: "media", icon: Music },
  { name: "user.dat", size: "2 KB", type: "config", icon: FileCog },
  { name: "icons.theme", size: "640 KB", type: "theme", icon: Palette },
  { name: "logo.png", size: "88 KB", type: "media", icon: ImageIcon },
];

const DEFAULT_POS: Record<AppId, { x: number; y: number }> = {
  settings: { x: 120, y: 60 },
  store: { x: 80, y: 40 },
  files: { x: 200, y: 90 },
};

const Index = () => {
  const [time, setTime] = useState(new Date());
  const [openApps, setOpenApps] = useState<AppId[]>([]);
  const [windowStates, setWindowStates] = useState<Record<AppId, WindowState>>({
    settings: { minimized: false, maximized: false, ...DEFAULT_POS.settings },
    store: { minimized: false, maximized: false, ...DEFAULT_POS.store },
    files: { minimized: false, maximized: false, ...DEFAULT_POS.files },
  });
  const [zOrder, setZOrder] = useState<AppId[]>([]);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
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
  const [pinned, setPinned] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("jolt-pinned") || "[]"),
  );
  const [filesTab, setFilesTab] = useState<"system" | "downloads" | "media">("system");
  const [storeQuery, setStoreQuery] = useState("");
  const [launchedApp, setLaunchedApp] = useState<StoreApp | null>(null);
  const [osFullscreen, setOsFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    localStorage.setItem("jolt-pinned", JSON.stringify(pinned));
  }, [pinned]);

  useEffect(() => {
    const onChange = () => setOsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) rootRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

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

  const focusApp = (app: AppId) => {
    setActiveApp(app);
    setZOrder((prev) => [...prev.filter((a) => a !== app), app]);
  };

  const openApp = (app: AppId) => {
    if (!openApps.includes(app)) setOpenApps((prev) => [...prev, app]);
    setWindowStates((p) => ({ ...p, [app]: { ...p[app], minimized: false } }));
    focusApp(app);
    setStartOpen(false);
  };

  const closeApp = (app: AppId) => {
    setOpenApps((prev) => prev.filter((a) => a !== app));
    setZOrder((prev) => prev.filter((a) => a !== app));
    setWindowStates((p) => ({
      ...p,
      [app]: { ...p[app], minimized: false, maximized: false },
    }));
    setActiveApp((cur) => {
      if (cur !== app) return cur;
      const remaining = zOrder.filter((a) => a !== app);
      return remaining.length ? remaining[remaining.length - 1] : null;
    });
  };

  const minimizeApp = (app: AppId) =>
    setWindowStates((p) => ({ ...p, [app]: { ...p[app], minimized: true } }));

  const toggleMaximize = (app: AppId) =>
    setWindowStates((p) => ({ ...p, [app]: { ...p[app], maximized: !p[app].maximized } }));

  const setPos = useCallback((app: AppId, x: number, y: number) => {
    setWindowStates((p) => ({ ...p, [app]: { ...p[app], x, y } }));
  }, []);

  const startInstall = (app: StoreApp) => {
    if (installs[app.id]?.state === "downloading") return;
    setInstalls((prev) => ({ ...prev, [app.id]: { state: "downloading", progress: 0 } }));
    const total = 3500 + Math.random() * 2000;
    const start = Date.now();
    const tick = () => {
      const pct = Math.min(100, ((Date.now() - start) / total) * 100);
      setInstalls((prev) => ({
        ...prev,
        [app.id]: { state: pct >= 100 ? "installed" : "downloading", progress: pct },
      }));
      if (pct < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const togglePin = (id: string) =>
    setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const installedApps = STORE_APPS.filter((a) => installs[a.id]?.state === "installed");
  const pinnedApps = STORE_APPS.filter(
    (a) => pinned.includes(a.id) && installs[a.id]?.state === "installed",
  );
  const filteredStoreApps = STORE_APPS.filter((a) =>
    a.name.toLowerCase().includes(storeQuery.toLowerCase()),
  );
  const featured = STORE_APPS[0];

  const zIndexFor = (app: AppId) => 20 + zOrder.indexOf(app);

  return (
    <div ref={rootRef} className="relative h-screen w-screen overflow-hidden font-sans text-foreground">
      <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
        <source src={asset("wallpaper.mp4")} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/10 to-purple-950/40" />

      {/* Desktop icons */}
      <div className="absolute left-4 top-4 z-10 grid gap-2">
        <DesktopIcon label="Settings" onOpen={() => openApp("settings")} icon={<Settings className="h-7 w-7 text-white" />} />
        <DesktopIcon label="Jolt Store" onOpen={() => openApp("store")} icon={<Store className="h-7 w-7 text-white" />} />
        <DesktopIcon label="Files" onOpen={() => openApp("files")} icon={<Folder className="h-7 w-7 text-white" />} />
        {installedApps.map((app) => (
          <DesktopIcon
            key={app.id}
            label={app.name.split(" ")[0]}
            onOpen={() => setLaunchedApp(app)}
            icon={<img src={app.image} alt={app.name} className="h-10 w-10 rounded-lg object-cover shadow-md ring-1 ring-white/30" />}
          />
        ))}
      </div>

      {/* SETTINGS */}
      {openApps.includes("settings") && !windowStates.settings.minimized && (
        <Window
          appId="settings"
          title="Settings"
          icon={<Settings className="h-3.5 w-3.5" />}
          state={windowStates.settings}
          z={zIndexFor("settings")}
          active={activeApp === "settings"}
          onClose={() => closeApp("settings")}
          onMinimize={() => minimizeApp("settings")}
          onMaximize={() => toggleMaximize("settings")}
          onFocus={() => focusApp("settings")}
          onMove={(x, y) => setPos("settings", x, y)}
          width={720}
        >
          <SettingsContent
            cloakTitle={cloakTitle}
            cloakIcon={cloakIcon}
            setCloakTitle={setCloakTitle}
            setCloakIcon={setCloakIcon}
            applyCloak={applyCloak}
            resetCloak={resetCloak}
            osFullscreen={osFullscreen}
            toggleFullscreen={toggleFullscreen}
          />
        </Window>
      )}

      {/* STORE */}
      {openApps.includes("store") && !windowStates.store.minimized && (
        <Window
          appId="store"
          title="Jolt Store"
          icon={<Store className="h-3.5 w-3.5" />}
          state={windowStates.store}
          z={zIndexFor("store")}
          active={activeApp === "store"}
          onClose={() => closeApp("store")}
          onMinimize={() => minimizeApp("store")}
          onMaximize={() => toggleMaximize("store")}
          onFocus={() => focusApp("store")}
          onMove={(x, y) => setPos("store", x, y)}
          width={840}
        >
          <StoreContent
            apps={filteredStoreApps}
            featured={featured}
            installs={installs}
            startInstall={startInstall}
            launch={(a) => setLaunchedApp(a)}
            query={storeQuery}
            setQuery={setStoreQuery}
          />
        </Window>
      )}

      {/* FILES */}
      {openApps.includes("files") && !windowStates.files.minimized && (
        <Window
          appId="files"
          title="Files"
          icon={<Folder className="h-3.5 w-3.5" />}
          state={windowStates.files}
          z={zIndexFor("files")}
          active={activeApp === "files"}
          onClose={() => closeApp("files")}
          onMinimize={() => minimizeApp("files")}
          onMaximize={() => toggleMaximize("files")}
          onFocus={() => focusApp("files")}
          onMove={(x, y) => setPos("files", x, y)}
          width={780}
        >
          <FilesContent
            tab={filesTab}
            setTab={setFilesTab}
            installedApps={installedApps}
            pinned={pinned}
            togglePin={togglePin}
            launch={(a) => setLaunchedApp(a)}
          />
        </Window>
      )}

      {/* Launched app fullscreen */}
      {launchedApp && (
        <div className="absolute inset-0 z-50 flex flex-col bg-black">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-background/90 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <img src={launchedApp.image} alt="" className="h-6 w-6 rounded object-cover" />
              <span className="text-base font-semibold">{launchedApp.name}</span>
            </div>
            <button
              onClick={() => setLaunchedApp(null)}
              className="flex h-9 min-w-[80px] items-center justify-center gap-2 rounded-md bg-destructive px-3 text-sm font-semibold text-destructive-foreground hover:opacity-90"
            >
              ✕ Close
            </button>
          </div>
          <iframe src={launchedApp.url} title={launchedApp.name} className="flex-1 border-0" />
          <button
            onClick={() => setLaunchedApp(null)}
            aria-label="Close app"
            className="fixed right-3 top-3 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-lg font-bold text-destructive-foreground shadow-xl ring-2 ring-white/30 hover:scale-105"
          >
            ✕
          </button>
        </div>
      )}

      {/* Start menu */}
      {startOpen && (
        <div className="glass-strong neon-ring absolute bottom-14 left-2 z-30 w-80 overflow-hidden rounded-2xl p-4 shadow-2xl">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Jolt Menu</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <TileButton icon={<Settings className="h-5 w-5" />} label="Settings" onClick={() => openApp("settings")} />
            <TileButton icon={<Store className="h-5 w-5" />} label="Store" onClick={() => openApp("store")} />
            <TileButton icon={<Folder className="h-5 w-5" />} label="Files" onClick={() => openApp("files")} />
            {installedApps.map((a) => (
              <TileButton
                key={a.id}
                icon={<img src={a.image} alt="" className="h-6 w-6 rounded object-cover" />}
                label={a.name.split(" ")[0]}
                onClick={() => {
                  setLaunchedApp(a);
                  setStartOpen(false);
                }}
              />
            ))}
          </div>
          <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
            <button
              onClick={() => {
                toggleFullscreen();
                setStartOpen(false);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              {osFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {osFullscreen ? "Windowed" : "Fullscreen"}
            </button>
            <button
              onClick={() => location.reload()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              <Power className="h-4 w-4" /> Restart
            </button>
          </div>
        </div>
      )}

      {/* Taskbar (Windows 11 style) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex h-12 items-center border-t border-white/10 bg-gradient-to-b from-zinc-900/85 to-zinc-950/95 px-3 backdrop-blur-2xl">
        {/* Left spacer */}
        <div className="flex-1" />

        {/* Center cluster: Start + pinned + open windows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStartOpen(!startOpen)}
            className="group relative flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-white/10"
            aria-label="Start"
            title="Start"
          >
            <span className="absolute inset-0 rounded-md bg-gradient-to-br from-yellow-300/20 via-fuchsia-500/20 to-sky-400/20 opacity-0 blur-md transition group-hover:opacity-100" />
            <span className="relative text-xl font-black neon-text">⚡</span>
          </button>
          {pinnedApps.map((app) => {
            const isOpen = openApps.includes("store"); // visual hint only
            return (
              <button
                key={`pin-${app.id}`}
                onClick={() => setLaunchedApp(app)}
                className="relative flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-white/10"
                title={app.name}
              >
                <img src={app.image} alt="" className="h-6 w-6 rounded-md object-cover" />
                {isOpen && false && (
                  <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-sky-400" />
                )}
              </button>
            );
          })}
          {openApps.map((app) => {
            const isActive = activeApp === app && !windowStates[app].minimized;
            return (
              <button
                key={app}
                onClick={() => {
                  if (windowStates[app].minimized || activeApp !== app) openApp(app);
                  else minimizeApp(app);
                }}
                className={`relative flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-white/10 ${
                  isActive ? "bg-white/15" : ""
                }`}
                title={app}
              >
                {app === "settings" && <Settings className="h-4 w-4" />}
                {app === "store" && <Store className="h-4 w-4" />}
                {app === "files" && <Folder className="h-4 w-4" />}
                <span
                  className={`absolute -bottom-0.5 left-1/2 h-[3px] -translate-x-1/2 rounded-full transition-all ${
                    isActive ? "w-5 bg-sky-400" : "w-2 bg-white/40"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Right system tray */}
        <div className="flex flex-1 items-center justify-end gap-1 text-xs text-white">
          <button onClick={toggleFullscreen} className="rounded-md p-1.5 hover:bg-white/10" title="Fullscreen">
            {osFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-white/10">
            <Wifi className="h-3.5 w-3.5" />
            <Volume2 className="h-3.5 w-3.5" />
            <Battery className="h-3.5 w-3.5" />
          </div>
          <button className="rounded-md px-2.5 py-1 text-right leading-tight hover:bg-white/10">
            <div className="text-[12px] font-medium tabular-nums">
              {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-[10px] tabular-nums opacity-80">
              {time.toLocaleDateString([], { month: "numeric", day: "numeric", year: "numeric" })}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Settings ---------- */

const SettingsContent = ({
  cloakTitle,
  cloakIcon,
  setCloakTitle,
  setCloakIcon,
  applyCloak,
  resetCloak,
  osFullscreen,
  toggleFullscreen,
}: {
  cloakTitle: string;
  cloakIcon: string;
  setCloakTitle: (s: string) => void;
  setCloakIcon: (s: string) => void;
  applyCloak: (t: string, i: string) => void;
  resetCloak: () => void;
  osFullscreen: boolean;
  toggleFullscreen: () => void;
}) => {
  const [section, setSection] = useState<"cloak" | "display" | "about">("cloak");
  return (
    <div className="flex">
      <aside className="w-52 shrink-0 border-r border-white/10 bg-gradient-to-b from-purple-950/40 to-background/20 p-3">
        <p className="mb-3 px-2 text-[10px] uppercase tracking-[0.2em] text-white/50">System</p>
        <NavItem active={section === "cloak"} onClick={() => setSection("cloak")} icon={<EyeOff className="h-4 w-4" />}>
          Tab Cloak
        </NavItem>
        <NavItem active={section === "display"} onClick={() => setSection("display")} icon={<Monitor className="h-4 w-4" />}>
          Display
        </NavItem>
        <NavItem active={section === "about"} onClick={() => setSection("about")} icon={<Info className="h-4 w-4" />}>
          About
        </NavItem>
      </aside>
      <div className="flex-1 p-6">
        {section === "cloak" && (
          <div>
            <SectionHeader title="Tab Cloaking" subtitle="Disguise this tab's title and favicon." />
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
            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Quick Presets</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setCloakTitle(p.title);
                      setCloakIcon(p.url);
                      applyCloak(p.title, p.url);
                    }}
                    className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm transition hover:border-white/30 hover:bg-white/10"
                  >
                    <img src={p.url} alt="" className="h-6 w-6 rounded" />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {section === "display" && (
          <div>
            <SectionHeader title="Display" subtitle="Control how Jolt-OS fills your screen." />
            <button
              onClick={toggleFullscreen}
              className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-fuchsia-600/20 via-purple-700/20 to-sky-500/20 p-5 transition hover:border-white/30"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-white/10 p-3">
                  {osFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
                </div>
                <div className="text-left">
                  <p className="font-semibold">{osFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</p>
                  <p className="text-xs text-muted-foreground">Immerse Jolt-OS across the whole display.</p>
                </div>
              </div>
              <span className="text-2xl opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100">→</span>
            </button>
          </div>
        )}
        {section === "about" && (
          <div>
            <SectionHeader title="About Jolt-OS" subtitle="System information." />
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-700/30 to-fuchsia-600/10 p-6">
              <div className="text-5xl font-black neon-text">⚡ Jolt</div>
              <p className="mt-2 text-sm text-muted-foreground">Version 1.3 — "Hollow Purple"</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat label="CPU" value="Bolt M2" />
                <Stat label="RAM" value="32 GB" />
                <Stat label="Storage" value="1 TB" />
                <Stat label="GPU" value="ArcLight 12" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-white/5 p-3">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="font-semibold">{value}</div>
  </div>
);

/* ---------- Store ---------- */

const StoreContent = ({
  apps,
  featured,
  installs,
  startInstall,
  launch,
  query,
  setQuery,
}: {
  apps: StoreApp[];
  featured: StoreApp;
  installs: Record<string, { state: InstallState; progress: number }>;
  startInstall: (a: StoreApp) => void;
  launch: (a: StoreApp) => void;
  query: string;
  setQuery: (s: string) => void;
}) => {
  return (
    <div className="flex">
      <aside className="w-48 shrink-0 border-r border-white/10 bg-gradient-to-b from-purple-950/40 to-background/20 p-3">
        <p className="mb-3 px-2 text-[10px] uppercase tracking-[0.2em] text-white/50">Browse</p>
        <NavItem active icon={<Sparkles className="h-4 w-4" />}>Discover</NavItem>
        <NavItem icon={<Star className="h-4 w-4" />}>Top Charts</NavItem>
        <NavItem icon={<Download className="h-4 w-4" />}>Updates</NavItem>
      </aside>
      <div className="flex-1">
        {/* Hero */}
        <div className="relative h-56 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${featured.accent} opacity-90`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
          <div className="relative flex h-full items-center gap-6 p-6">
            <img
              src={featured.image}
              alt=""
              className="h-36 w-36 rounded-2xl object-cover shadow-2xl ring-2 ring-white/30"
            />
            <div className="flex-1 text-white drop-shadow">
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-90">Featured</p>
              <h2 className="mt-1 text-3xl font-black leading-tight">{featured.name}</h2>
              <p className="mt-1 text-sm opacity-90">{featured.tagline}</p>
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className="rounded-full bg-black/30 px-2 py-0.5">{featured.developer}</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-current" /> {featured.rating}</span>
                <span className="opacity-75">{featured.size}</span>
              </div>
              <div className="mt-3">
                <AppleInstallButton
                  state={installs[featured.id]?.state ?? "idle"}
                  progress={installs[featured.id]?.progress ?? 0}
                  onGet={() => startInstall(featured)}
                  onOpen={() => launch(featured)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-white/10 bg-background/40 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the Jolt Store…"
              className="pl-9"
            />
          </div>
        </div>

        {/* List */}
        <div className="space-y-3 p-4">
          <p className="px-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">All Apps</p>
          {apps.map((app) => {
            const st = installs[app.id];
            const state = st?.state ?? "idle";
            return (
              <div
                key={app.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur transition hover:border-white/30"
              >
                <div className={`absolute inset-x-0 -top-px h-px bg-gradient-to-r ${app.accent} opacity-60`} />
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${app.accent} opacity-0 blur transition group-hover:opacity-70`} />
                    <img src={app.image} alt={app.name} className="relative h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-white/20" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{app.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{app.tagline}</p>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{app.developer}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-current text-yellow-400" /> {app.rating}</span>
                      <span>{app.size}</span>
                    </div>
                    {state === "downloading" && (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={st.progress} className="h-1.5 flex-1" />
                        <span className="text-xs tabular-nums text-muted-foreground">{Math.floor(st.progress)}%</span>
                      </div>
                    )}
                  </div>
                  <AppleInstallButton
                    state={state}
                    progress={st?.progress ?? 0}
                    onGet={() => startInstall(app)}
                    onOpen={() => launch(app)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ---------- Files ---------- */

const FilesContent = ({
  tab,
  setTab,
  installedApps,
  pinned,
  togglePin,
  launch,
}: {
  tab: "system" | "downloads" | "media";
  setTab: (t: "system" | "downloads" | "media") => void;
  installedApps: StoreApp[];
  pinned: string[];
  togglePin: (id: string) => void;
  launch: (a: StoreApp) => void;
}) => (
  <div className="flex">
    <aside className="w-48 shrink-0 border-r border-white/10 bg-gradient-to-b from-purple-950/40 to-background/20 p-3 text-sm">
      <p className="mb-3 px-2 text-[10px] uppercase tracking-[0.2em] text-white/50">Locations</p>
      <NavItem active={tab === "system"} onClick={() => setTab("system")} icon={<HardDrive className="h-4 w-4" />}>System</NavItem>
      <NavItem active={tab === "downloads"} onClick={() => setTab("downloads")} icon={<Download className="h-4 w-4" />}>Downloads</NavItem>
      <NavItem active={tab === "media"} onClick={() => setTab("media")} icon={<ImageIcon className="h-4 w-4" />}>Media</NavItem>
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
        <div className="mb-1 text-muted-foreground">Storage</div>
        <Progress value={42} className="h-1.5" />
        <div className="mt-1 text-muted-foreground">418 GB of 1 TB used</div>
      </div>
    </aside>
    <div className="flex-1 p-5">
      {tab === "system" && (
        <div>
          <Breadcrumb path={["Jolt", "System"]} />
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Size</th>
                </tr>
              </thead>
              <tbody>
                {SYSTEM_FILES.map((f, i) => (
                  <tr key={f.name} className={`border-t border-white/5 hover:bg-white/5 ${i % 2 ? "bg-white/[0.02]" : ""}`}>
                    <td className="flex items-center gap-2 px-3 py-2.5">
                      <f.icon className="h-4 w-4 text-fuchsia-300" />
                      {f.name}
                    </td>
                    <td className="px-3 py-2.5 capitalize text-muted-foreground">{f.type}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{f.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === "downloads" && (
        <div>
          <Breadcrumb path={["Jolt", "Downloads"]} />
          {installedApps.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-white/20 p-12 text-center text-sm text-muted-foreground">
              No downloads yet. Visit the Jolt Store to install apps.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {installedApps.map((app) => {
                const isPinned = pinned.includes(app.id);
                return (
                  <div
                    key={app.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition hover:border-white/30 hover:bg-white/10"
                  >
                    <button onClick={() => launch(app)} className="block w-full">
                      <img
                        src={app.image}
                        alt={app.name}
                        className="mx-auto h-20 w-20 rounded-2xl object-cover shadow-lg ring-1 ring-white/20 transition-transform group-hover:scale-105"
                      />
                      <p className="mt-2 line-clamp-2 text-xs">{app.name}</p>
                    </button>
                    <button
                      onClick={() => togglePin(app.id)}
                      className={`absolute right-2 top-2 rounded-full bg-background/70 p-1.5 transition ${
                        isPinned ? "opacity-100 text-yellow-300" : "opacity-0 group-hover:opacity-100"
                      }`}
                      title={isPinned ? "Unpin from taskbar" : "Pin to taskbar"}
                    >
                      {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {tab === "media" && (
        <div>
          <Breadcrumb path={["Jolt", "Media"]} />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <video src={asset("wallpaper.mp4")} muted loop autoPlay playsInline className="h-32 w-full object-cover" />
              <div className="p-2 text-xs">wallpaper.mp4</div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

const Breadcrumb = ({ path }: { path: string[] }) => (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    {path.map((p, i) => (
      <span key={i} className="flex items-center gap-1">
        {i > 0 && <span className="opacity-50">›</span>}
        <span className={i === path.length - 1 ? "text-foreground" : ""}>{p}</span>
      </span>
    ))}
  </div>
);

/* ---------- Reusable bits ---------- */

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-5">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </div>
);

const NavItem = ({
  active,
  onClick,
  icon,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
      active
        ? "bg-gradient-to-r from-fuchsia-500/30 to-purple-500/20 text-foreground shadow-inner"
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    }`}
  >
    <span className={active ? "text-fuchsia-300" : ""}>{icon}</span>
    {children}
  </button>
);

const TileButton = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-white/10 to-white/0 p-2 text-xs transition hover:from-fuchsia-500/30 hover:to-purple-500/10"
  >
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-foreground transition group-hover:scale-110">
      {icon}
    </div>
    <span className="line-clamp-1">{label}</span>
  </button>
);

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
      <button
        onClick={onOpen}
        className="flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-5 text-sm font-bold text-white shadow-lg shadow-fuchsia-900/40 transition hover:scale-105 active:scale-95"
      >
        <Play className="h-3.5 w-3.5 fill-current" /> OPEN
      </button>
    );
  }
  if (state === "downloading") {
    return (
      <div className="relative h-9 w-9">
        <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" className="fill-none stroke-white/15" strokeWidth="2.5" />
          <circle
            cx="18"
            cy="18"
            r="15"
            className="fill-none stroke-fuchsia-400 transition-all"
            strokeWidth="2.5"
            strokeDasharray={`${(progress / 100) * 94.25} 94.25`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-sm bg-fuchsia-300" />
        </div>
      </div>
    );
  }
  return (
    <button
      onClick={onGet}
      className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-5 text-sm font-bold text-foreground backdrop-blur transition hover:bg-white/20 active:scale-95"
    >
      <Download className="h-3.5 w-3.5" /> GET
    </button>
  );
};

const DesktopIcon = ({
  label,
  icon,
  onOpen,
}: {
  label: string;
  icon: React.ReactNode;
  onOpen: () => void;
}) => (
  <button
    onDoubleClick={onOpen}
    onClick={onOpen}
    className="group flex w-20 flex-col items-center gap-1 rounded-xl p-2 text-center text-xs text-white transition hover:bg-white/10"
  >
    <div className="transition-transform group-hover:scale-110 group-hover:drop-shadow-[0_4px_12px_rgba(168,85,247,0.6)]">
      {icon}
    </div>
    <span className="drop-shadow-md">{label}</span>
  </button>
);

/* ---------- Window ---------- */

const Window = ({
  appId,
  title,
  icon,
  children,
  state,
  z,
  active,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  width = 640,
}: {
  appId: AppId;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  state: WindowState;
  z: number;
  active: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  width?: number;
}) => {
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (state.maximized) return;
    onFocus();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    dragRef.current = { dx: e.clientX - state.x, dy: e.clientY - state.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const x = Math.max(-100, Math.min(window.innerWidth - 100, e.clientX - dragRef.current.dx));
    const y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragRef.current.dy));
    onMove(x, y);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      onMouseDown={onFocus}
      style={{
        zIndex: z,
        ...(state.maximized
          ? { left: 0, top: 0 }
          : { left: state.x, top: state.y, width }),
      }}
      className={`absolute overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] glass-strong scanline transition-shadow ${
        active ? "ring-1 ring-fuchsia-400/40" : "ring-1 ring-white/10"
      } ${state.maximized ? "h-[calc(100vh-3rem)] w-screen rounded-none" : ""}`}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onMaximize}
        className="flex h-10 cursor-grab select-none items-center justify-between border-b border-white/10 bg-gradient-to-r from-purple-950/60 via-background/40 to-fuchsia-950/40 px-3 active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-fuchsia-300">{icon}</span>
          {title}
        </div>
        <div className="flex items-center gap-1">
          <TitleBtn onClick={onMinimize} title="Minimize"><Minus className="h-3.5 w-3.5" /></TitleBtn>
          <TitleBtn onClick={onMaximize} title={state.maximized ? "Restore" : "Maximize"}>
            {state.maximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </TitleBtn>
          <TitleBtn onClick={onClose} title="Close" danger>✕</TitleBtn>
        </div>
      </div>
      <div className={state.maximized ? "h-[calc(100%-2.5rem)] overflow-y-auto" : "max-h-[72vh] overflow-y-auto"}>
        {children}
      </div>
    </div>
  );
};

const TitleBtn = ({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
      danger ? "hover:bg-destructive hover:text-destructive-foreground" : "hover:bg-white/10"
    }`}
  >
    {children}
  </button>
);

export default Index;
