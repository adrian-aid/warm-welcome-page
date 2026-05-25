import { BarChart3, Bot, Lightbulb, Building2, Info } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Dashboard", icon: BarChart3, end: true },
  { to: "/analyst", label: "AI Analyst", icon: Bot, end: false },
  { to: "/insights", label: "Insights", icon: Lightbulb, end: false },
  { to: "/banking", label: "Banking Sector", icon: Building2, end: false },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden text-sm font-semibold text-foreground sm:block">
            AUS Banking Intelligence
          </span>
          <Badge variant="outline" className="hidden text-xs text-muted-foreground sm:block">
            Analytics Showcase
          </Badge>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              activeClassName="bg-primary/15 text-primary"
              pendingClassName="opacity-60"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:text-sm"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:block">{label}</span>
            </NavLink>
          ))}

          {/* About dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>About This Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  An end-to-end analytics platform demonstrating LLM-assisted
                  financial data analysis, built entirely on free Australian
                  regulatory and market data sources.
                </p>
                <div>
                  <p className="mb-1 font-medium text-foreground">Data Sources</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>RBA — Cash Rate Target (rba.gov.au)</li>
                    <li>ABS — CPI, Employment, GDP (abs.gov.au)</li>
                    <li>APRA — Monthly ADI Statistics (apra.gov.au)</li>
                    <li>ASX Bank Stocks via yfinance</li>
                    <li>News via RBA, APRA, ASIC &amp; ABC Business RSS feeds</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-medium text-foreground">AI Architecture</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>LangChain pandas agent for natural language data queries</li>
                    <li>LangChain LLMChain for executive insight generation</li>
                    <li>Llama 3.3 70B via Groq API (free tier)</li>
                    <li>Python FastAPI backend + React TypeScript frontend</li>
                  </ul>
                </div>
                <p className="text-xs">
                  Data freshness: macro data refreshes every 24 hours; stock
                  prices every 6 hours. All fallback data is static snapshots
                  used when live fetch is unavailable.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </nav>
  );
}
