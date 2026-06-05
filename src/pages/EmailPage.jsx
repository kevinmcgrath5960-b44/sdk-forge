import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

export default function EmailPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    base44.entities.User.list().then(setUsers).catch(() => {});
  }, []);

  const sendEmail = async () => {
    if (!to || !subject || !body) return;
    setSending(true);
    await base44.integrations.Core.SendEmail({ to, subject, body });
    toast({ title: "Email sent successfully" });
    setSending(false);
    setSubject("");
    setBody("");
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <PageHeader icon={Mail} title="Email" description="Send notification emails to registered users." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> Compose Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Recipient</Label>
            {users.length > 0 ? (
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a user" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="user@example.com" className="mt-1" />
            )}
          </div>
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" className="mt-1" />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message..." rows={5} className="mt-1" />
          </div>
          <Button onClick={sendEmail} disabled={sending || !to || !subject || !body} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}