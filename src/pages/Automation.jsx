import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Zap, Loader2, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { processItem } from "@/functions/processItem";
import PageHeader from "@/components/PageHeader";

export default function Automation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: () => base44.entities.Item.list("-created_date", 100),
  });

  const pendingItems = items.filter((i) => i.status !== "processed");

  const handleProcess = async () => {
    if (!selectedId) return;
    setProcessing(true);
    const res = await processItem({ item_id: selectedId });
    toast({ title: res.data?.message || "Item processed" });
    queryClient.invalidateQueries({ queryKey: ["items"] });
    setProcessing(false);
    setSelectedId("");
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <PageHeader icon={Zap} title="Automation" description="Run backend functions and view scheduled tasks." />

      <div className="space-y-6">
        {/* Process Item */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" /> Process Item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select an item and run the backend function to set its status to "processed" and stamp the time.
            </p>
            <div>
              <Label>Select Item</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pick an item..." /></SelectTrigger>
                <SelectContent>
                  {pendingItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title} ({item.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleProcess} disabled={processing || !selectedId} className="gap-2">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Process
            </Button>
          </CardContent>
        </Card>

        {/* Scheduled Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Daily Summary (Scheduled)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A scheduled automation runs daily and emails an admin a summary of Items created in the past 24 hours. This runs automatically in the background.
            </p>
            <Badge variant="secondary" className="mt-3">Active — runs daily at 8:00 AM</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}