import { useState } from "react";
import { ArrowLeft, ListChecks, Upload, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const ActionPlan = () => {
  const [transcript, setTranscript] = useState("");
  const [actionItems, setActionItems] = useState<string[]>([]);
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
    
    // TODO: Integrate with Sarvam API for patient action plan generation
    // const response = await fetch('/api/generate-action-plan', {
    //   method: 'POST',
    //   body: JSON.stringify({ transcript, targetLanguage: 'te' }),
    // });
    
    // Simulate API call
    setTimeout(() => {
      setActionItems([
        "రోజుకు మూడు సార్లు మందులు తీసుకోండి (Take medicines three times daily)",
        "రక్త పరీక్ష చేయించుకోవడం మర్చిపోకండి (Don't forget to get blood test done)",
        "2 వారాల తర్వాత మళ్లీ రండి (Visit again after 2 weeks)",
        "ఎక్కువ నీరు త్రాగండి - రోజుకు 8 గ్లాసులు (Drink more water - 8 glasses daily)",
        "ఎక్కువ ఉప్పు తినడం మానేయండి (Avoid eating too much salt)",
      ]);
      setIsGenerating(false);
      toast({
        title: "Success",
        description: "Action plan generated successfully",
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
              <ListChecks className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Patient's Action Plan</h1>
              <p className="text-muted-foreground">Simple action items in patient's language</p>
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
                      Generate Action Plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5" />
                  Patient Action Items
                </CardTitle>
                <CardDescription>
                  Clear, bulleted instructions in Telugu
                  <Badge variant="secondary" className="ml-2">తెలుగు</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {actionItems.length > 0 ? (
                  <div className="space-y-4">
                    {actionItems.map((item, index) => (
                      <div key={index} className="flex gap-3 p-4 rounded-lg bg-muted">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-sm flex-1">{item}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    Action items will appear here after generation...
                  </div>
                )}
                {actionItems.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-4">
                    {/* TODO: Add integration note */}
                    Note: This is placeholder data. Actual implementation will use Sarvam API for translation.
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

export default ActionPlan;
