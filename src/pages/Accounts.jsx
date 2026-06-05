import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Save, Loader2, UserPlus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

export default function Accounts() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setBio(u.bio || "");
    });
  }, []);

  const saveBio = async () => {
    setSaving(true);
    await base44.auth.updateMe({ bio });
    toast({ title: "Profile updated" });
    setSaving(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, inviteRole);
    toast({ title: `Invited ${inviteEmail} as ${inviteRole}` });
    setInviteEmail("");
    setInviting(false);
  };

  if (!user) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <PageHeader icon={Users} title="Accounts" description="Manage your profile, invite users, and control access." />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          {user.role === "admin" && <TabsTrigger value="invite">Invite Users</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                Profile
                <Badge variant="secondary" className="text-xs">{user.role}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs">Email</Label>
                <p className="font-mono text-sm mt-1">{user.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Full Name</Label>
                <p className="text-sm mt-1">{user.full_name || "Not set"}</p>
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <Button onClick={saveBio} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === "admin" && (
          <TabsContent value="invite">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5" />
                  Invite New User
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="gap-2">
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Send Invite
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}