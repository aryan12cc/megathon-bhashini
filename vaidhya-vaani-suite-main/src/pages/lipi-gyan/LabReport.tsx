import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface LabTest {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "normal" | "borderline" | "abnormal";
  explanation: string;
}

const LabReport = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tests, setTests] = useState<LabTest[]>([
    {
      name: "Fasting Blood Sugar",
      value: "140",
      unit: "mg/dL",
      referenceRange: "70-99",
      status: "abnormal",
      explanation: "ఇది మీ రక్తంలో చక్కెర స్థాయిని కొలుస్తుంది (This measures your blood sugar level)",
    },
    {
      name: "Total Cholesterol",
      value: "195",
      unit: "mg/dL",
      referenceRange: "< 200",
      status: "borderline",
      explanation: "This measures cholesterol in your blood",
    },
    {
      name: "Hemoglobin",
      value: "14.5",
      unit: "g/dL",
      referenceRange: "13.5-17.5",
      status: "normal",
      explanation: "This measures oxygen-carrying capacity of blood",
    },
  ]);

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

      setReportFile(newFile);
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

  const handleScanConfirm = () => {
    if (!reportFile || !originalFileName) return;
    // TODO: Integrate Bhashini OCR API for text extraction
    // TODO: Use Gemini/Sarvam API to identify test name, value, and reference range
    // TODO: Implement color-coding logic based on ranges
    toast.success(`Analyzing lab report "${originalFileName}"...`);
    handleCancel();
  };

  const handleCancel = () => {
    setReportFile(null);
    setPreviewUrl(null);
    setOriginalFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "borderline":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "abnormal":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-success/10 text-success";
      case "borderline":
        return "bg-warning/10 text-warning";
      case "abnormal":
        return "bg-destructive/10 text-destructive";
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
            <h1 className="text-3xl font-bold mb-2">Lab Report Analyzer</h1>
            <p className="text-muted-foreground">
              Color-coded analysis with simple explanations for each test
            </p>
          </div>

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
                  <div className="rounded-full bg-secondary/10 p-4">
                    <Upload className="h-8 w-8 text-secondary" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold mb-1">Upload Lab Report</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag & drop or click to upload your lab report (.jpg, .png)
                    </p>
                    <Button onClick={handleUploadClick} className="bg-gradient-secondary">
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
                    alt="Lab report preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg mb-4"
                  />
                  <div className="flex justify-center gap-4">
                    <Button onClick={handleScanConfirm} className="bg-gradient-secondary">
                      Confirm and Scan
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-2xl font-bold">1</p>
                    <p className="text-sm text-muted-foreground">Normal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-2xl font-bold">1</p>
                    <p className="text-sm text-muted-foreground">Borderline</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">1</p>
                    <p className="text-sm text-muted-foreground">Abnormal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tests.map((test, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <h4 className="font-semibold">{test.name}</h4>
                          <p className="text-sm opacity-80">{test.explanation}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {test.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="opacity-70">Your Result</p>
                        <p className="font-bold text-lg">{test.value} {test.unit}</p>
                      </div>
                      <div>
                        <p className="opacity-70">Reference Range</p>
                        <p className="font-medium">{test.referenceRange} {test.unit}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LabReport;
