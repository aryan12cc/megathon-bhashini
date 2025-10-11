import { useState } from "react";
import { ArrowLeft, CalendarClock, Upload, Sparkles, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface TimelineEvent {
  date: string;
  type: string;
  description: string;
  details: string[];
}

const HealthSummary = () => {
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileNames = Array.from(files).map(f => f.name);
      setUploadedDocs([...uploadedDocs, ...fileNames]);
      toast({
        title: "Success",
        description: `${fileNames.length} document(s) uploaded`,
      });
    }
  };

  const handleGenerate = async () => {
    if (uploadedDocs.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one document first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // TODO: Integrate with Gemini API for health summary generation
    // const response = await fetch('/api/generate-health-summary', {
    //   method: 'POST',
    //   body: JSON.stringify({ documents: uploadedDocs }),
    // });
    
    // Simulate API call
    setTimeout(() => {
      setTimeline([
        {
          date: "2024-01-15",
          type: "Consultation",
          description: "Initial diagnosis of Type 2 Diabetes",
          details: [
            "Fasting Blood Sugar: 145 mg/dL",
            "Started on Metformin 500mg",
            "Dietary counseling provided"
          ]
        },
        {
          date: "2024-02-20",
          type: "Lab Report",
          description: "Follow-up blood work",
          details: [
            "HbA1c: 7.2%",
            "Lipid profile: Elevated LDL",
            "Kidney function: Normal"
          ]
        },
        {
          date: "2024-03-10",
          type: "Consultation",
          description: "Medication adjustment",
          details: [
            "Added Atorvastatin 10mg for cholesterol",
            "Metformin increased to 850mg",
            "Weight loss progress: 3kg"
          ]
        },
        {
          date: "2024-04-05",
          type: "Lab Report",
          description: "Improved parameters",
          details: [
            "Fasting Blood Sugar: 118 mg/dL",
            "HbA1c: 6.8%",
            "LDL cholesterol: Within target"
          ]
        }
      ]);
      setIsGenerating(false);
      toast({
        title: "Success",
        description: "Health summary generated successfully",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-12">
        <Link to="/saaransh" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Saaransh
        </Link>

        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-primary/10 p-2">
              <CalendarClock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Longitudinal Health Summary</h1>
              <p className="text-muted-foreground">Chronological overview of patient's medical history</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Documents
                </CardTitle>
                <CardDescription>
                  Upload lab reports, discharge summaries, and prescriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm font-medium">Click to upload documents</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
                    </label>
                  </div>

                  {uploadedDocs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Uploaded Documents:</p>
                      {uploadedDocs.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm flex-1 truncate">{doc}</span>
                          <Badge variant="secondary" className="text-xs">✓</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || uploadedDocs.length === 0}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                        Generating Timeline...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Health Summary
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  Medical Timeline
                </CardTitle>
                <CardDescription>
                  Chronological view of health events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length > 0 ? (
                  <div className="space-y-6 relative before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-border">
                    {timeline.map((event, index) => (
                      <div key={index} className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {event.date}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {event.type}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">{event.description}</p>
                          <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                            {event.details.map((detail, idx) => (
                              <li key={idx} className="list-disc">{detail}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    Timeline will appear here after generation...
                  </div>
                )}
                {timeline.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-4">
                    {/* TODO: Add integration note */}
                    Note: This is placeholder data. Actual implementation will use Gemini API.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HealthSummary;
