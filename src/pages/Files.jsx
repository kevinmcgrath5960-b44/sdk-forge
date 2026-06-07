import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileUp, Loader2, Link2, Lock, ExternalLink } from "lucide-react";
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

  const [privateFile, setPrivateFile] = useState(null);
  const [privateSignedUrl, setPrivateSignedUrl] = useState("");
  const [privateUploading, setPrivateUploading] = useState(false);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const uploadPublic = async () => {
    if (!publicFile) return;
    setPublicUploading(true);
    const fileData = await toBase64(publicFile);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: fileData });
    setPublicUrl(file_url);
    setPublicUploading(false);
    toast({ title: "Public file uploaded" });
  };

  const uploadPrivate = async () => {
    if (!privateFile) return;
    setPrivateUploading(true);
    const fileData = await toBase64(privateFile);
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: fileData });
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 300 });
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
              <div className="mt-3 p-3 bg-muted rounded-lg flex items-center gap-2 overflow-hidden">
                <ExternalLink className="w-4 h-4 shrink-0 text-primary" />
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary truncate hover:underline">
                  {publicUrl}
                </a>
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
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-600 mb-1 font-medium">Temporary signed URL (expires in 5 minutes)</p>
                <a href={privateSignedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary truncate hover:underline block">
                  {privateSignedUrl.slice(0, 80)}...
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}