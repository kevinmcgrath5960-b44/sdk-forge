import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { geminiGenerateImage } from "@/functions/geminiGenerateImage";
import { geminiExtractData } from "@/functions/geminiExtractData";
import { Sparkles, Loader2, Image as ImageIcon, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

export default function AITools() {
  const { toast } = useToast();

  // Text gen
  const [textPrompt, setTextPrompt] = useState("");
  const [textResult, setTextResult] = useState("");
  const [textLoading, setTextLoading] = useState(false);

  // Image gen
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [imgLoading, setImgLoading] = useState(false);

  // Extract
  const [extractFile, setExtractFile] = useState(null);
  const [extractResult, setExtractResult] = useState(null);
  const [extractLoading, setExtractLoading] = useState(false);

  const generateText = async () => {
    if (!textPrompt) return;
    setTextLoading(true);
    setTextResult("");
    const res = await base44.integrations.Core.InvokeLLM({ prompt: textPrompt });
    setTextResult(res);
    setTextLoading(false);
  };

  const generateImage = async () => {
    if (!imgPrompt) return;
    setImgLoading(true);
    setImgUrl("");
    const res = await geminiGenerateImage({ prompt: imgPrompt });
    setImgUrl(res.data.url);
    setImgLoading(false);
  };

  const extractData = async () => {
    if (!extractFile) return;
    setExtractLoading(true);
    setExtractResult(null);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: extractFile });
    const res = await geminiExtractData({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          invoice_number: { type: "string" },
          date: { type: "string" },
          total_amount: { type: "number" },
          vendor: { type: "string" },
        },
      },
    });
    setExtractResult(res.data.output);
    setExtractLoading(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <PageHeader icon={Sparkles} title="AI Tools" description="Generate text, create images, and extract data from documents." />

      <div className="space-y-6">
        {/* Text Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Text Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={textPrompt} onChange={(e) => setTextPrompt(e.target.value)} placeholder="Enter a prompt..." rows={2} />
            <Button onClick={generateText} disabled={textLoading || !textPrompt} className="gap-2">
              {textLoading && <Loader2 className="w-4 h-4 animate-spin" />} Generate
            </Button>
            {textResult && (
              <div className="mt-3 p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap font-mono">{textResult}</div>
            )}
          </CardContent>
        </Card>

        {/* Image Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-accent" /> Image Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} placeholder="Describe the image..." />
            <Button onClick={generateImage} disabled={imgLoading || !imgPrompt} variant="secondary" className="gap-2">
              {imgLoading && <Loader2 className="w-4 h-4 animate-spin" />} Generate Image
            </Button>
            {imgUrl && (
              <div className="mt-3">
                <img src={imgUrl} alt="Generated" className="rounded-lg max-h-80 object-contain border" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Extraction */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-emerald-500" /> Document Data Extraction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Upload a document (PDF, image, etc.)</Label>
              <Input type="file" onChange={(e) => setExtractFile(e.target.files?.[0] || null)} className="mt-1" />
            </div>
            <Button onClick={extractData} disabled={extractLoading || !extractFile} variant="secondary" className="gap-2">
              {extractLoading && <Loader2 className="w-4 h-4 animate-spin" />} Extract Data
            </Button>
            {extractResult && (
              <div className="mt-3 p-4 bg-muted rounded-lg">
                <pre className="text-sm font-mono whitespace-pre-wrap">{JSON.stringify(extractResult, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}