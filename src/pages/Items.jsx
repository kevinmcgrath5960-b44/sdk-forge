import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box, Plus, Trash2, CheckCircle2, Pencil, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

const statusColors = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  active: "bg-blue-100 text-blue-700 border-blue-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
  processed: "bg-violet-100 text-violet-700 border-violet-200",
};

const categoryColors = {
  bug: "bg-red-50 text-red-600",
  feature: "bg-indigo-50 text-indigo-600",
  task: "bg-slate-50 text-slate-600",
  docs: "bg-teal-50 text-teal-600",
};

export default function Items() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ title: "", status: "pending", category: "task", number: 0 });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => base44.entities.Item.list("-created_date", 100),
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.Item.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    });
    return unsub;
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Item.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Item.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setDialogOpen(false);
      setEditingItem(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Item.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  const resetForm = () => setForm({ title: "", status: "pending", category: "task", number: 0 });

  const openCreate = () => { resetForm(); setEditingItem(null); setDialogOpen(true); };
  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ title: item.title, status: item.status, category: item.category, number: item.number || 0 });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const bulkAdd = async () => {
    const samples = Array.from({ length: 5 }, (_, i) => ({
      title: `Sample Item ${Date.now()}-${i}`,
      status: ["pending", "active", "done"][i % 3],
      category: ["bug", "feature", "task", "docs"][i % 4],
      number: Math.floor(Math.random() * 100),
    }));
    await base44.entities.Item.bulkCreate(samples);
    queryClient.invalidateQueries({ queryKey: ["items"] });
    toast({ title: "Added 5 sample items" });
  };

  const markAllDone = async () => {
    const pending = items.filter((i) => i.status === "pending");
    if (!pending.length) { toast({ title: "No pending items" }); return; }
    for (const item of pending) {
      await base44.entities.Item.update(item.id, { status: "done" });
    }
    queryClient.invalidateQueries({ queryKey: ["items"] });
    toast({ title: `Marked ${pending.length} items as done` });
  };

  const filtered = items.filter((item) => {
    const s = statusFilter === "all" || item.status === statusFilter;
    const c = categoryFilter === "all" || item.category === categoryFilter;
    return s && c;
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <PageHeader icon={Box} title="Items" description="Create, edit, delete, and list items with real-time updates." />

      {/* Actions bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Item
        </Button>
        <Button variant="outline" onClick={bulkAdd} className="gap-2">
          <Sparkles className="w-4 h-4" /> Bulk Add 5
        </Button>
        <Button variant="outline" onClick={markAllDone} className="gap-2">
          <CheckCircle2 className="w-4 h-4" /> Mark All Pending → Done
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="docs">Docs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No items found.</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Card key={item.id} className="flex items-center justify-between px-4 py-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="secondary" className={`${statusColors[item.status]} border text-xs`}>
                  {item.status}
                </Badge>
                <span className="font-medium truncate">{item.title}</span>
                <Badge variant="secondary" className={`${categoryColors[item.category]} text-[11px]`}>
                  {item.category}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">#{item.number ?? 0}</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "New Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Item title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="docs">Docs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Number</Label>
              <Input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}