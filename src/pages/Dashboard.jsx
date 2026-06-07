import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, LayoutDashboard, RefreshCw, Bot, TrendingUp, CheckCircle2, Clock, Zap } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { updateDashboard } from "@/functions/updateDashboard";
import { useToast } from "@/components/ui/use-toast";

const STATUS_COLORS = {
  pending: "#f59e0b",
  active: "#3b82f6",
  done: "#10b981",
  processed: "#8b5cf6",
};

const CATEGORY_COLORS = {
  bug: "#ef4444",
  feature: "#6366f1",
  task: "#64748b",
  docs: "#14b8a6",
};

export default function Dashboard() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentLog, setAgentLog] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    const data = await base44.entities.Item.list("-created_date", 200);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  // --- Derived stats ---
  const total = items.length;
  const byStatus = ["pending", "active", "done", "processed"].map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: items.filter((i) => i.status === s).length,
    fill: STATUS_COLORS[s],
  }));
  const byCategory = ["bug", "feature", "task", "docs"].map((c) => ({
    name: c.charAt(0).toUpperCase() + c.slice(1),
    value: items.filter((i) => i.category === c).length,
    fill: CATEGORY_COLORS[c],
  }));

  // Group by day (last 14 days)
  const trendData = (() => {
    const days = 14;
    const map = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      map[key] = { date: key, pending: 0, active: 0, done: 0, processed: 0 };
    }
    items.forEach((item) => {
      const d = new Date(item.created_date);
      const key = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      if (map[key] && item.status) map[key][item.status]++;
    });
    return Object.values(map);
  })();

  // Avg number per category
  const avgNumberData = ["bug", "feature", "task", "docs"].map((c) => {
    const subset = items.filter((i) => i.category === c && i.number != null);
    const avg = subset.length ? subset.reduce((s, i) => s + (i.number || 0), 0) / subset.length : 0;
    return { name: c.charAt(0).toUpperCase() + c.slice(1), avg: Math.round(avg) };
  });

  const runAgent = async () => {
    setAgentRunning(true);
    setAgentLog("");
    const res = await updateDashboard({});
    setAgentLog(res.data?.summary || "Agent completed.");
    await fetchItems();
    toast({ title: "Agent finished", description: res.data?.summary });
    setAgentRunning(false);
  };

  const statCards = [
    { label: "Total Items", value: total, icon: LayoutDashboard, color: "text-primary" },
    { label: "Pending", value: byStatus[0].value, icon: Clock, color: "text-amber-500" },
    { label: "Done", value: byStatus[2].value, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Processed", value: byStatus[3].value, icon: Zap, color: "text-violet-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          description="Visual analytics for your item data — status, category, and trends."
        />
        <div className="flex gap-2 mt-1">
          <Button variant="outline" size="sm" onClick={fetchItems} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={runAgent} disabled={agentRunning} className="gap-2">
            {agentRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
            Run Agent
          </Button>
        </div>
      </div>

      {agentLog && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4 flex gap-2 items-start">
            <Bot className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{agentLog}</p>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color} opacity-80`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Status pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Items by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {byStatus.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Items by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {byCategory.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Activity trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Activity Trend (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {Object.entries(STATUS_COLORS).map(([key, color]) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} name={key.charAt(0).toUpperCase() + key.slice(1)} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Avg number per category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Avg. Number Value by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={avgNumberData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="avg" name="Avg Number" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Legend badges */}
      <div className="flex flex-wrap gap-2 mt-6">
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <Badge key={k} variant="secondary" style={{ backgroundColor: v + "20", color: v, borderColor: v + "40" }} className="border">
            {k}
          </Badge>
        ))}
        {Object.entries(CATEGORY_COLORS).map(([k, v]) => (
          <Badge key={k} variant="secondary" style={{ backgroundColor: v + "20", color: v, borderColor: v + "40" }} className="border">
            {k}
          </Badge>
        ))}
      </div>
    </div>
  );
}