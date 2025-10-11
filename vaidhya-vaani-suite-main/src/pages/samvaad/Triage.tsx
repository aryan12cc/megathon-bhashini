import { useState } from "react";
import { Send, Volume2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const Triage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);

  const questions = [
    "What is your name?",
    "What is your age?",
    "What symptoms are you experiencing?",
    "How long have you had these symptoms?",
    "Any existing medical conditions?",
  ];

  const handleTextToSpeech = () => {
    // TODO: Integrate Bhashini TTS API to speak question in local language
    // API endpoint: https://bhashini.gov.in/tts
    // Required: Text, target language, voice preferences
    toast.success("Playing question in local language");
  };

  const handleSubmit = (answer: string) => {
    if (!answer.trim()) return;

    setResponses([...responses, answer]);
    
    // TODO: Integrate Bhashini ASR + MT APIs
    // 1. Transcribe patient's voice response (ASR)
    // 2. Translate to English (MT)
    // 3. Auto-fill registration form
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // TODO: Process complete triage data
      // TODO: Suggest department based on symptoms using AI
      toast.success("Triage complete! Patient assigned to General Physician");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Smart Reception & Triage</h1>
            <p className="text-muted-foreground">
              Automated patient intake with multilingual support
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Question {currentStep + 1} of {questions.length}
              </span>
              <Badge>{Math.round(((currentStep + 1) / questions.length) * 100)}% Complete</Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-primary transition-all duration-300"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{questions[currentStep]}</CardTitle>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleTextToSpeech}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your answer or use voice input..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button onClick={() => {
                  const input = document.querySelector('input') as HTMLInputElement;
                  handleSubmit(input.value);
                  input.value = '';
                }}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Supports voice input in 22 Indian languages
              </p>
              {/* TODO: Add voice recording button with Bhashini ASR */}
            </CardContent>
          </Card>

          {/* Responses History */}
          {responses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Collected Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {responses.map((response, index) => (
                  <div key={index} className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-sm text-muted-foreground">{questions[index]}</span>
                    <span className="text-sm font-medium">{response}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default Triage;
