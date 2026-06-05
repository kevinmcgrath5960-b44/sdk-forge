import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  Box, Users, Sparkles, FileUp, Mail, Zap, BarChart3, MessageSquare, LogOut, Terminal
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { path: "/", label: "Items", icon: Box },
  { path: "/accounts", label: "Accounts", icon: Users },
  { path: "/ai-tools", label: "AI Tools", icon: Sparkles },
  { path: "/files", label: "Files", icon: FileUp },
  { path: "/email", label: "Email", icon: Mail },
  { path: "/automation", label: "Automation", icon: Zap },
  { path: "/tracking", label: "Tracking", icon: BarChart3 },
  { path: "/chat", label: "AI Chat", icon: MessageSquare },
];

export default function AppLayout() {
  const location = useLocation();

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Terminal className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold font-heading tracking-tight">SDK Playground</h1>
              <p className="text-[11px] text-muted-foreground font-mono">v1.0.0</p>
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-0.5 px-3">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = path === "/" 
                ? location.pathname === "/" 
                : location.pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <nav className="flex overflow-x-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = path === "/" 
              ? location.pathname === "/" 
              : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] min-w-[60px] ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}