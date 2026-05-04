import { useEffect, useState } from "react";
import { Settings, Power, Wifi, Volume2, Battery } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESETS = [
  { name: "Google", url: "https://www.google.com/favicon.ico", title: "Google" },
  { name: "Google Classroom", url: "https://ssl.gstatic.com/classroom/favicon.png", title: "Classes" },
  { name: "Google Docs", url: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico", title: "Docs" },
  { name: "Khan Academy", url: "https://cdn.kastatic.org/images/favicon.ico", title: "Khan Academy" },
  { name: "Wikipedia", url: "https://en.wikipedia.org/static/favicon/wikipedia.ico", title: "Wikipedia" },
];

const Index = () => {
  const [time, setTime] = useState(new Date());
  const [openApps, setOpenApps] = useState<string[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [cloakTitle, setCloakTitle] = useState("");
  const [cloakIcon, setCloakIcon] = useState("");

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

  return (
    <div className="relative h-screen w-screen overflow-hidden font-sans text-foreground">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/wallpaper.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/20" />

      {/* Desktop icons */}
      <div className="absolute left-4 top-4 grid gap-4 z-10">
        <DesktopIcon
          label="Settings"
          onDoubleClick={() => openApp("settings")}
          icon={<Settings className="h-8 w-8 text-white" />}
        />
      </div>

      {/* Windows */}
      {openApps.includes("settings") && (
        <Window
          title="Settings"
          onClose={() => closeApp("settings")}
          onFocus={() => setActiveApp("settings")}
          active={activeApp === "settings"}
        >
          <div className="space-y-6 p-6">
            <section>
              <h2 className="mb-1 text-lg font-semibold">Tab Cloaking</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Disguise this tab's title and icon.
              </p>
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="title">Tab Title</Label>
                  <Input
                    id="title"
                    value={cloakTitle}
                    onChange={(e) => setCloakTitle(e.target.value)}
                    placeholder="Google"
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Favicon URL</Label>
                  <Input
                    id="icon"
                    value={cloakIcon}
                    onChange={(e) => setCloakIcon(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => applyCloak(cloakTitle, cloakIcon)}>Apply</Button>
                  <Button variant="outline" onClick={resetCloak}>
                    Reset
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">Presets</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <Button
                      key={p.name}
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setCloakTitle(p.title);
                        setCloakIcon(p.url);
                        applyCloak(p.title, p.url);
                      }}
                    >
                      <img src={p.url} alt="" className="mr-2 h-4 w-4" />
                      {p.name}
                    </Button>
                  ))}
                </div>
              </div>
            </section>
            <section>
              <h2 className="mb-1 text-lg font-semibold">About</h2>
              <p className="text-sm text-muted-foreground">
                Jolt-OS v1.0 — built with bolt energy ⚡
              </p>
            </section>
          </div>
        </Window>
      )}

      {/* Start menu */}
      {startOpen && (
        <div className="absolute bottom-14 left-2 z-30 w-72 rounded-lg border border-white/20 bg-background/80 p-3 shadow-2xl backdrop-blur-xl">
          <p className="mb-2 px-2 text-xs uppercase tracking-wider text-muted-foreground">
            Pinned
          </p>
          <button
            onClick={() => openApp("settings")}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-white/10"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
          <div className="mt-3 border-t border-white/10 pt-2">
            <button
              onClick={() => location.reload()}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-white/10"
            >
              <Power className="h-5 w-5" />
              <span>Restart</span>
            </button>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex h-12 items-center justify-between border-t border-white/20 bg-background/60 px-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStartOpen(!startOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10"
            aria-label="Start"
          >
            <div className="text-xl font-black bg-gradient-to-br from-yellow-300 to-purple-500 bg-clip-text text-transparent">
              ⚡
            </div>
          </button>
          {openApps.map((app) => (
            <button
              key={app}
              onClick={() => setActiveApp(app)}
              className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm capitalize hover:bg-white/10 ${
                activeApp === app ? "bg-white/20" : ""
              }`}
            >
              <Settings className="h-4 w-4" />
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

const DesktopIcon = ({
  label,
  icon,
  onDoubleClick,
}: {
  label: string;
  icon: React.ReactNode;
  onDoubleClick: () => void;
}) => (
  <button
    onDoubleClick={onDoubleClick}
    onClick={onDoubleClick}
    className="flex w-20 flex-col items-center gap-1 rounded p-2 text-center text-xs text-white hover:bg-white/10"
  >
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
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onFocus: () => void;
  active: boolean;
}) => (
  <div
    onMouseDown={onFocus}
    className={`absolute left-1/2 top-1/2 z-20 w-[640px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-white/20 bg-background/90 shadow-2xl backdrop-blur-xl ${
      active ? "ring-1 ring-white/30" : ""
    }`}
  >
    <div className="flex h-9 items-center justify-between border-b border-white/10 bg-background/50 px-3">
      <span className="text-sm font-medium">{title}</span>
      <div className="flex gap-1">
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground"
        >
          ✕
        </button>
      </div>
    </div>
    <div className="max-h-[70vh] overflow-y-auto">{children}</div>
  </div>
);

export default Index;
