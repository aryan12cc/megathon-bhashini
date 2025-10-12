import { useState, useRef } from "react";
import { Upload, FileText, Pill, Calendar, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface APIResponse {
  status: string;
  data: {
    english_text: string;
    ocr_text: string;
    source_language: string;
    target_language: string;
    summary_english: {
      summary: string;
    };
    summary_native: {
      summary: string;
    };
  };
}

const Discharge = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [summaryFile, setSummaryFile] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("Tamil");
  const [activeTab, setActiveTab] = useState("diagnosis");
  const [summaryEnglish, setSummaryEnglish] = useState<string>("");
  const [summaryNative, setSummaryNative] = useState<string>("");

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = (file: File) => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const supportedFormats = ["jpg", "png"];

    if (fileExtension && supportedFormats.includes(fileExtension)) {
      setOriginalFileName(file.name);
      const timestamp = new Date().getTime();
      const newFileName = `${timestamp}.${fileExtension}`;
      const newFile = new File([file], newFileName, { type: file.type });

      setSummaryFile(newFile);
      setPreviewUrl(URL.createObjectURL(newFile));
    } else {
      toast.error("Unsupported file format. Please upload a .jpg or .png file.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const items = event.dataTransfer.items;
    if (items && items.length > 0) {
      const item = items[0];
      if (item.kind === "file" && (item.type === "image/jpg" || item.type === "image/png")) {
        setIsDragging(true);
      }
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleScanConfirm = async () => {
    if (!summaryFile || !originalFileName) return;
    
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('image_file', summaryFile);
    formData.append('source_language', sourceLanguage);
    formData.append('target_language', targetLanguage);
    formData.append('document_type', 'discharge_summary');

    try {
      const response = await fetch('http://localhost:5001/process_document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const result: APIResponse = await response.json();

      if (result.status === 'success') {
        setSummaryEnglish(result.data.summary_english.summary);
        setSummaryNative(result.data.summary_native.summary);
        toast.success(`Successfully analyzed discharge summary "${originalFileName}"`);
      } else {
        toast.error('Failed to parse discharge summary');
      }
    } catch (error) {
      console.error('Error processing discharge summary:', error);
      toast.error('Failed to process discharge summary. Please try again.');
    } finally {
      setIsProcessing(false);
      handleCancel();
    }
  };

  const handleCancel = () => {
    setSummaryFile(null);
    setPreviewUrl(null);
    setOriginalFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".jpg,.png"
      />

      <section className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Discharge Summary Navigator</h1>
            <p className="text-muted-foreground">
              Navigate long summaries with tabbed sections for quick access
            </p>
          </div>

          {/* Language Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Language Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Source Language</label>
                  <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Telugu">Telugu</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Kannada">Kannada</SelectItem>
                      <SelectItem value="Malayalam">Malayalam</SelectItem>
                      <SelectItem value="Bengali">Bengali</SelectItem>
                      <SelectItem value="Marathi">Marathi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Target Language</label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select target language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Telugu">Telugu</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Kannada">Kannada</SelectItem>
                      <SelectItem value="Malayalam">Malayalam</SelectItem>
                      <SelectItem value="Bengali">Bengali</SelectItem>
                      <SelectItem value="Marathi">Marathi</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card className="mb-6">
            <CardContent
              className={`py-8 ${isDragging ? "border-2 border-dashed border-primary" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {!previewUrl ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="rounded-full bg-accent/10 p-4">
                    <Upload className="h-8 w-8 text-accent" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold mb-1">Upload Discharge Summary</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag & drop or click to upload your summary (.jpg, .png)
                    </p>
                    <Button onClick={handleUploadClick} className="bg-accent hover:bg-accent/90">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="font-semibold mb-4">Image Preview</h3>
                  <img
                    src={previewUrl}
                    alt="Discharge summary preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg mb-4"
                  />
                  <div className="flex justify-center gap-4">
                    <Button onClick={handleScanConfirm} className="bg-accent hover:bg-accent/90" disabled={isProcessing}>
                      {isProcessing ? "Processing..." : "Confirm and Scan"}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          {(summaryEnglish || summaryNative) && (
            <Card>
              <CardHeader>
                <CardTitle>Summary Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="diagnosis" className="gap-2">
                      <FileText className="h-4 w-4" />
                      English Summary
                    </TabsTrigger>
                    <TabsTrigger value="native" className="gap-2">
                      <FileText className="h-4 w-4" />
                      {targetLanguage} Summary
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="diagnosis" className="space-y-4 mt-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Discharge Summary (English)</h4>
                      <p className="text-sm whitespace-pre-wrap">{summaryEnglish}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="native" className="space-y-4 mt-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Discharge Summary ({targetLanguage})</h4>
                      <p className="text-sm whitespace-pre-wrap">{summaryNative}</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default Discharge;
