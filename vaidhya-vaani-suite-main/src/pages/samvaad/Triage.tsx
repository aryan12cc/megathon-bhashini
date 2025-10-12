import { useState, useRef } from "react";
import { Send, Volume2, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Language options for TTS
const LANGUAGE_OPTIONS = [
  { code: "hi", name: "Hindi - हिंदी" },
  { code: "en", name: "English" },
  { code: "bn", name: "Bengali - বাংলা" },
  { code: "te", name: "Telugu - తెలుగు" },
  { code: "ta", name: "Tamil - தமிழ்" },
  { code: "mr", name: "Marathi - मराठी" },
  { code: "gu", name: "Gujarati - ગુજરાતી" },
  { code: "kn", name: "Kannada - ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam - മലയാളം" },
  { code: "pa", name: "Punjabi - ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia - ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese - অসমীয়া" },
];

const Triage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("hi");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const questions = [
    "What is your name?",
    "What is your age?",
    "What symptoms are you experiencing?",
    "How long have you had these symptoms?",
    "Any existing medical conditions?",
  ];

  const handleTextToSpeech = async () => {
    if (isPlayingAudio) {
      toast.info("Audio is already playing");
      return;
    }

    try {
      setIsPlayingAudio(true);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8005";
      const currentQuestion = questions[currentStep];

      toast.loading("Translating question...");

      // Step 1: Translate question from English to selected language using MT
      let translatedQuestion = currentQuestion;
      
      if (selectedLanguage !== "en") {
        const mtResponse = await fetch(`${API_BASE_URL}/mt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: currentQuestion,
            source: "English",
            dest: selectedLanguage,
          }),
        });

        const mtData = await mtResponse.json();
        console.log("MT API Response:", mtData);
        console.log("MT Data object:", mtData.data);

        if (mtData.status === "success" && mtData.data) {
          // Check multiple possible field names for translated text
          const translated = mtData.data.translated_text || 
                           mtData.data.output_text || 
                           mtData.data.text ||
                           mtData.data.translatedText;
          
          if (translated) {
            translatedQuestion = translated;
            console.log(`✓ Translation successful:`);
            console.log(`  Original (EN): "${currentQuestion}"`);
            console.log(`  Translated (${selectedLanguage}): "${translatedQuestion}"`);
          } else {
            console.error("Translation text not found in response. Data:", mtData.data);
            toast.dismiss();
            toast.error("Translation failed. Using original text.");
          }
        } else {
          console.error("MT API Error:", mtData);
          toast.dismiss();
          toast.error("Translation failed. Using original text.");
        }
      } else {
        console.log("Language is English, skipping MT");
      }

      toast.dismiss();
      toast.loading("Generating speech...");

      // Step 2: Convert translated text to speech using TTS
      const ttsResponse = await fetch(`${API_BASE_URL}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: translatedQuestion,
          Language: selectedLanguage,
          gender: "female",
          speed: 1.0,
        }),
      });

      const ttsData = await ttsResponse.json();

      if (ttsData.status === "success" && ttsData.data?.audio_url) {
        toast.dismiss();
        toast.success(`Playing in ${LANGUAGE_OPTIONS.find(l => l.code === selectedLanguage)?.name}`);

        // Stop previous audio if playing
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        // Create and play new audio
        const audio = new Audio(ttsData.data.audio_url);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlayingAudio(false);
          audioRef.current = null;
        };

        audio.onerror = () => {
          toast.dismiss();
          toast.error("Failed to play audio");
          setIsPlayingAudio(false);
          audioRef.current = null;
        };

        await audio.play();
      } else {
        toast.dismiss();
        toast.error(ttsData.error || "Failed to generate speech");
        setIsPlayingAudio(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      toast.dismiss();
      toast.error("Failed to generate speech. Please try again.");
      setIsPlayingAudio(false);
    }
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
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex-1">{questions[currentStep]}</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleTextToSpeech}
                    disabled={isPlayingAudio}
                  >
                    {isPlayingAudio ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
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
                Question will be spoken in {LANGUAGE_OPTIONS.find(l => l.code === selectedLanguage)?.name || "selected language"}
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
