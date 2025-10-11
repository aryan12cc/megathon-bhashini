import { useState } from "react";
import { ArrowLeft, FileCheck, Upload, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const ClinicalNotes = () => {
  const [transcript, setTranscript] = useState("");
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      toast({
        title: "Error",
        description: "Please enter a consultation transcript first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // TODO: Integrate with Gemini API for SOAP note generation
    // const response = await fetch('/api/generate-soap', {
    //   method: 'POST',
    //   body: JSON.stringify({ transcript }),
    // });
    
    // Simulate API call
    setTimeout(() => {
      setGeneratedNotes(`SUBJECTIVE:
Patient presents with complaint of persistent headache for the past 3 days.
Reports moderate pain intensity (6/10), worse in the mornings.
No history of similar episodes. No associated nausea or vomiting.

OBJECTIVE:
Vitals: BP 128/82, HR 76, Temp 98.2°F
Alert and oriented, no neurological deficits noted.
No signs of meningeal irritation.

ASSESSMENT:
Tension-type headache, likely stress-related.

PLAN:
1. Prescribed Ibuprofen 400mg TID for 5 days
2. Advised adequate hydration and stress management
3. Follow-up in 1 week if symptoms persist
4. Red flag symptoms explained to patient`);
      setIsGenerating(false);
      toast({
        title: "Success",
        description: "Clinical notes generated successfully",
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
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Clinical Note Generator</h1>
              <p className="text-muted-foreground">Automatic SOAP notes from consultation transcripts</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Consultation Transcript
                </CardTitle>
                <CardDescription>
                  Enter or paste the consultation transcript below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter consultation transcript here..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="w-full mt-4"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate SOAP Notes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Generated SOAP Notes
                </CardTitle>
                <CardDescription>
                  AI-generated clinical documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatedNotes}
                  readOnly
                  className="min-h-[400px] font-mono text-sm bg-muted"
                  placeholder="Generated SOAP notes will appear here..."
                />
                <p className="text-xs text-muted-foreground mt-4">
                  {/* TODO: Add integration note */}
                  Note: This is a placeholder output. Actual implementation will use Gemini API.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClinicalNotes;
