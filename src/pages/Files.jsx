import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileUp, Loader2, Link2, Lock, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

export default function Files() {
  const { toast } = useToast();

  const [publicFile, setPublicFile] = useState(null);
  const [publicUrl, setPublicUrl] = useState("");
  const [publicUploading, setPublicUploading] = useState(false);
  const [publicCopied, setPublicCopied] = useState(false);

  const [privateFile, setPrivateFile] = useState(null);
  const [privateSignedUrl, setPrivateSignedUrl] = useState("");
  const [privateUploading, setPrivateUploading] = useState(false);
  const [privateCopied, setPrivateCopied] = useState(false);

  const copyToClipboard = async (url, setCopied) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const uploadPublic = async () => {
    if (!publicFile) return;
    setPublicUploading(true);
    setPublicUrl("");
    const result = await base44.integrations.Core.UploadFile({ file: publicFile });
    // Frontend SDK wraps response in .data
    const data = result?.data ?? result;
    const url = data?.file_url || data?.url || (typeof data === "string" ? data : "");
    setPublicUrl(url);
    setPublicUploading(false);
    toast({ title: "Public file uploaded" });
  };

  const uploadPrivate = async () => {
    if (!privateFile) return;
    setPrivateUploading(true);
    setPrivateSignedUrl("");
    const uploadResult = await base44.integrations.Core.UploadPrivateFile({ file: privateFile });
    const uploadData = uploadResult?.data ?? uploadResult;
    const file_uri = uploadData?.file_uri || (typeof uploadData === "string" ? uploadData : "");
    const signResult = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 300 });
    const signData = signResult?.data ?? signResult;
    const signed_url = signData?.signed_url || (typeof signData === "string" ? signData : "");
    setPrivateSignedUrl(signed_url);
    setPrivateUploading(false);
    toast({ title: "Private file uploaded & signed URL created (5 min)" });
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <PageHeader icon={FileUp} title="Files" description="Upload public and private files, generate shareable links." />

      <div className="space-y-6">
        {/* Public Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" /> Public File Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Choose a file</Label>
              <Input type="file" onChange={(e) => setPublicFile(e.target.files?.[0] || null)} className="mt-1" />
            </div>
            <Button onClick={uploadPublic} disabled={publicUploading || !publicFile} className="gap-2">
              {publicUploading && <Loader2 className="w-4 h-4 animate-spin" />} Upload Public
            </Button>
            {publicUrl && (
              <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Shareable link:</p>
                <div className="flex items-center gap-2">
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex-1 min-w-0 break-all hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    {publicUrl}
                  </a>
                  <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8" onClick={() => copyToClipboard(publicUrl, setPublicCopied)}>
                    {publicCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Private Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" /> Private File Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Choose a file</Label>
              <Input type="file" onChange={(e) => setPrivateFile(e.target.files?.[0] || null)} className="mt-1" />
            </div>
            <Button onClick={uploadPrivate} disabled={privateUploading || !privateFile} variant="secondary" className="gap-2">
              {privateUploading && <Loader2 className="w-4 h-4 animate-spin" />} Upload Private
            </Button>
            {privateSignedUrl && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <p className="text-xs text-amber-600 font-medium">Temporary signed URL (expires in 5 minutes):</p>
                <div className="flex items-center gap-2">
                  <a href={privateSignedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex-1 min-w-0 break-all hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    {privateSignedUrl}
                  </a>
                  <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8" onClick={() => copyToClipboard(privateSignedUrl, setPrivateCopied)}>
                    {privateCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}