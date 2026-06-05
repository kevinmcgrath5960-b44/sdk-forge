import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3, MousePointer, Eye, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

export default function Tracking() {
  const { toast } = useToast();
  const [clickCount, setClickCount] = useState(0);

  // Track page visit on mount
  useEffect(() => {
    base44.analytics.track({
      eventName: "page_visit",
      properties: { page: "tracking" },
    });
  }, []);

  const trackClick = (label) => {
    setClickCount((c) => c + 1);
    base44.analytics.track({
      eventName: "button_click",
      properties: { label, click_number: clickCount + 1 },
    });
    toast({ title: `Tracked: "${label}" click` });
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <PageHeader icon={BarChart3} title="Tracking" description="Track button clicks and page visits for analytics." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Page Visit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">page_visit</code> event was tracked when this page loaded.
            </p>
            <Badge variant="secondary" className="mt-3">Logged automatically</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-accent" /> Button Click Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the buttons below to fire analytics events. Total clicks this session: <strong>{clickCount}</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => trackClick("primary_action")} className="gap-2">
                <Zap className="w-4 h-4" /> Primary Action
              </Button>
              <Button variant="secondary" onClick={() => trackClick("secondary_action")} className="gap-2">
                <Zap className="w-4 h-4" /> Secondary Action
              </Button>
              <Button variant="outline" onClick={() => trackClick("outline_action")} className="gap-2">
                <Zap className="w-4 h-4" /> Outline Action
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}