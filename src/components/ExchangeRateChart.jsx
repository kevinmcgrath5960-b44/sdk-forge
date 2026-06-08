import React, { useState, useEffect } from "react";
import { getHistoricalRates } from "@/functions/getHistoricalRates";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, subMonths, subYears, startOfYear } from "date-fns";

const CURRENCY_COLORS = {
  EUR: "#6366f1",
  USD: "#10b981",
  DKK: "#f59e0b",
};

const PRESETS = [
  { label: "Last 30 days",  value: "30d",   group: null },
  { label: "Last 90 days",  value: "90d",   group: null },
  { label: "Last 300 days", value: "300d",  group: "week" },
  { label: "This year",     value: "ytd",   group: "month" },
  { label: "Last 2 years",  value: "2y",    group: "month" },
  { label: "Last 5 years",  value: "5y",    group: "month" },
];

function getFromDate(preset) {
  const today = new Date();
  switch (preset) {
    case "30d":  return subDays(today, 30);
    case "90d":  return subDays(today, 90);
    case "300d": return subDays(today, 300);
    case "ytd":  return startOfYear(today);
    case "2y":   return subYears(today, 2);
    case "5y":   return subYears(today, 5);
    default:     return subDays(today, 300);
  }
}

export default function ExchangeRateChart() {
  const [preset, setPreset] = useState("300d");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const presetObj = PRESETS.find((p) => p.value === preset);
    const from = format(getFromDate(preset), "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");

    setLoading(true);
    setError(null);

    getHistoricalRates({ from, to: today, group: presetObj?.group || null })
      .then((res) => {
        const raw = res.data?.data || [];
        // Group by date into { date, EUR, USD, DKK }
        const map = {};
        raw.forEach(({ date, quote, rate }) => {
          if (!map[date]) map[date] = { date };
          map[date][quote] = rate;
        });
        const sorted = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
        setChartData(sorted);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [preset]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">GBP as base currency</p>
        <Select value={preset} onValueChange={setPreset}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value} className="text-xs">
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[260px]">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[260px] text-sm text-destructive">{error}</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return format(d, chartData.length > 60 ? "MMM yy" : "d MMM");
              }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
            <Tooltip
              labelFormatter={(v) => format(new Date(v), "d MMM yyyy")}
              formatter={(value, name) => [Number(value).toFixed(4), name]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {Object.entries(CURRENCY_COLORS).map(([currency, color]) => (
              <Line
                key={currency}
                type="monotone"
                dataKey={currency}
                stroke={color}
                strokeWidth={2}
                dot={false}
                name={currency}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}