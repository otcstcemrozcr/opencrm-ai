import { LineChart, Target, Building2 } from "lucide-react";

const highlights = [
  {
    icon: LineChart,
    title: "See revenue at a glance",
    desc: "Pipeline, forecast and risk — understood in 60 seconds.",
  },
  {
    icon: Target,
    title: "Focus on what wins",
    desc: "Grounded insights and next actions, straight from your data.",
  },
  {
    icon: Building2,
    title: "Enterprise-grade & multi-tenant",
    desc: "Org-scoped data with role-based access from day one.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between">
        {/* gradient washes */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_10%,rgba(37,99,235,0.35),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_90%_90%,rgba(37,99,235,0.20),transparent_60%)]" />
        {/* dotted grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative z-10 p-12">
          <div className="text-xl font-semibold tracking-tight text-white">
            OpenCRM <span className="text-accent">AI</span>
          </div>
        </div>

        <div className="relative z-10 px-12">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
            The revenue engine for modern sales teams.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Campaign to closed-won, with an AI analyst watching the numbers so
            your team can focus on selling.
          </p>

          <div className="mt-10 space-y-5">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 ring-1 ring-accent/30">
                    <Icon className="h-[18px] w-[18px] text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{h.title}</div>
                    <div className="text-sm text-white/60">{h.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 p-12 text-xs text-white/40">
          © {new Date().getFullYear()} OpenCRM AI · Revenue Operations
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center bg-muted/40 p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <div className="text-2xl font-semibold text-primary">
              OpenCRM <span className="text-accent">AI</span>
            </div>
            <p className="text-sm text-muted-foreground">Revenue Operations platform</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
