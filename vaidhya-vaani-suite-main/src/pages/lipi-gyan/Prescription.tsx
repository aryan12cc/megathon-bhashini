import { useState, useRef } from "react";
import { Upload, Bell, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

interface APIResponse {
  status: string;
  data: {
    english_text: string;
    ocr_text: string;
    source_language: string;
    target_language: string;
    summary_english: {
      medicines: Array<{
        medicine_name: string;
        dosage_mg: string;
        number_of_days: string;
        timing: {
          morning: boolean;
          afternoon: boolean;
          evening: boolean;
          night: boolean;
        };
      }>;
    };
    summary_native: {
      medicines: Array<{
        medicine_name: string;
        dosage_mg: string;
        number_of_days: string;
        timing: {
          morning: boolean;
          afternoon: boolean;
          evening: boolean;
          night: boolean;
        };
      }>;
    };
  };
}

const Prescription = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("Hindi");
  const [medicines, setMedicines] = useState<Medicine[]>([]);

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

      setPrescriptionFile(newFile);
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
    if (!prescriptionFile || !originalFileName) return;
    
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('image_file', prescriptionFile);
    formData.append('source_language', sourceLanguage);
    formData.append('target_language', targetLanguage);
    formData.append('document_type', 'prescription');

    try {
      const response = await fetch('http://localhost:5001/process_document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const result: APIResponse = await response.json();

      if (result.status === 'success' && result.data.summary_english.medicines) {
        const parsedMedicines: Medicine[] = result.data.summary_english.medicines.map((med) => {
          const timing = med.timing;
          return {
            name: med.medicine_name,
            dosage: med.dosage_mg !== "not specified" ? med.dosage_mg : "As prescribed",
            frequency: `${timing.morning ? '1' : '0'}-${timing.afternoon ? '1' : '0'}-${timing.evening || timing.night ? '1' : '0'}`,
            duration: med.number_of_days !== "not specified" ? `${med.number_of_days} days` : "As prescribed",
            morning: timing.morning,
            afternoon: timing.afternoon,
            night: timing.evening || timing.night,
          };
        });

        setMedicines(parsedMedicines);
        toast.success(`Successfully analyzed prescription "${originalFileName}"`);
      } else {
        toast.error('Failed to parse prescription data');
      }
    } catch (error) {
      console.error('Error processing prescription:', error);
      toast.error('Failed to process prescription. Please try again.');
    } finally {
      setIsProcessing(false);
      handleCancel();
    }
  };

  const handleCancel = () => {
    setPrescriptionFile(null);
    setPreviewUrl(null);
    setOriginalFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const setReminder = (medicineName: string) => {
    // TODO: Integrate with device calendar/alarm API
    toast.success(`Reminder set for ${medicineName}`);
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
            <h1 className="text-3xl font-bold mb-2">Prescription Decoder</h1>
            <p className="text-muted-foreground">
              Scan and understand prescriptions in a structured, easy-to-read format
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
                  <div className="rounded-full bg-primary/10 p-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold mb-1">Upload Prescription</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag & drop or click to upload your prescription (.jpg, .png)
                    </p>
                    <Button onClick={handleUploadClick}>
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
                    alt="Prescription preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg mb-4"
                  />
                  <div className="flex justify-center gap-4">
                    <Button onClick={handleScanConfirm} disabled={isProcessing}>
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

          {/* Medicines Table */}
          {medicines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Medications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicines.map((medicine, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{medicine.name}</h4>
                          <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                        </div>
                        <Badge variant="secondary">{medicine.duration}</Badge>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                            medicine.morning ? 'bg-warning text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            🌅
                          </div>
                          <span className="text-sm">Morning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                            medicine.afternoon ? 'bg-info text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            ☀️
                          </div>
                          <span className="text-sm">Afternoon</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                            medicine.night ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            🌙
                          </div>
                          <span className="text-sm">Night</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReminder(medicine.name)}
                        >
                          <Bell className="mr-2 h-3 w-3" />
                          Set Reminder
                        </Button>
                        <Button size="sm" variant="outline">
                          <BookOpen className="mr-2 h-3 w-3" />
                          Learn More
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default Prescription;
