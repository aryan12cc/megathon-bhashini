import { useState } from "react";
import { Upload, FileText, Pill, Calendar, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Discharge = () => {
  const [activeTab, setActiveTab] = useState("diagnosis");

  const handleUpload = () => {
    // TODO: Integrate Bhashini OCR+MT for multi-page document processing
    // TODO: Use Gemini API to automatically chunk content into logical sections
    // Sections: Diagnosis, Treatment History, Medications, Follow-up Instructions
    toast.success("Discharge summary processed successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Discharge Summary Navigator</h1>
            <p className="text-muted-foreground">
              Navigate long summaries with tabbed sections for quick access
            </p>
          </div>

          {/* Upload Card */}
          <Card className="mb-6">
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="rounded-full bg-accent/10 p-4">
                  <Upload className="h-8 w-8 text-accent" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold mb-1">Upload Discharge Summary</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload multi-page discharge summary for intelligent parsing
                  </p>
                  <Button onClick={handleUpload} className="bg-accent hover:bg-accent/90">
                    <Upload className="mr-2 h-4 w-4" />
                    Scan Summary
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Card>
            <CardHeader>
              <CardTitle>Summary Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="diagnosis" className="gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Diagnosis
                  </TabsTrigger>
                  <TabsTrigger value="treatment" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Treatment
                  </TabsTrigger>
                  <TabsTrigger value="medications" className="gap-2">
                    <Pill className="h-4 w-4" />
                    Medications
                  </TabsTrigger>
                  <TabsTrigger value="followup" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Follow-up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="diagnosis" className="space-y-4 mt-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Primary Diagnosis</h4>
                    <p className="text-sm">Acute Bronchitis with mild respiratory distress</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Secondary Diagnosis</h4>
                    <p className="text-sm">Seasonal allergic rhinitis</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Clinical Notes</h4>
                    <p className="text-sm">
                      Patient presented with persistent cough, mild fever, and difficulty breathing.
                      Chest X-ray showed no signs of pneumonia. Treated with antibiotics and bronchodilators.
                    </p>
                  </div>
                  {/* TODO: Auto-populate from Gemini API parsing */}
                </TabsContent>

                <TabsContent value="treatment" className="space-y-4 mt-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Hospitalization Duration</h4>
                    <p className="text-sm">3 days (Jan 10-12, 2025)</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Procedures Performed</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Nebulization therapy (4 times daily)</li>
                      <li>IV antibiotics administration</li>
                      <li>Oxygen support as needed</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Response to Treatment</h4>
                    <p className="text-sm">Patient showed significant improvement. Breathing normalized by day 2.</p>
                  </div>
                </TabsContent>

                <TabsContent value="medications" className="space-y-4 mt-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Continue Taking</h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex justify-between">
                        <span>Azithromycin 500mg</span>
                        <span className="text-muted-foreground">Once daily × 3 days</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Salbutamol Inhaler</span>
                        <span className="text-muted-foreground">As needed</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Cetirizine 10mg</span>
                        <span className="text-muted-foreground">Once daily at night</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <h4 className="font-semibold mb-2 text-destructive">Discontinued</h4>
                    <ul className="text-sm space-y-1">
                      <li>IV Ceftriaxone (hospital medication)</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="followup" className="space-y-4 mt-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-2">Next Appointment</h4>
                    <p className="text-sm">January 20, 2025 at 10:00 AM</p>
                    <p className="text-xs text-muted-foreground mt-1">Dr. Singh, Pulmonology Department</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Instructions</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Complete the full course of antibiotics</li>
                      <li>Use inhaler if breathing difficulty occurs</li>
                      <li>Avoid dust, smoke, and cold air</li>
                      <li>Drink plenty of warm fluids</li>
                      <li>Return immediately if fever exceeds 101°F</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Warning Signs</h4>
                    <p className="text-sm text-destructive">
                      Seek immediate medical attention if: severe breathing difficulty, chest pain,
                      high fever (above 102°F), or coughing up blood.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Discharge;
