import { useState } from "react";
import { ArrowLeft, FileCheck, Upload, Sparkles, Languages } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  { code: "English", name: "English" },
  { code: "Hindi", name: "Hindi (हिन्दी)" },
  { code: "Bengali", name: "Bengali (বাংলা)" },
  { code: "Tamil", name: "Tamil (தமிழ்)" },
  { code: "Telugu", name: "Telugu (తెలుగు)" },
  { code: "Kannada", name: "Kannada (ಕನ್ನಡ)" },
  { code: "Malayalam", name: "Malayalam (മലയാളം)" },
  { code: "Marathi", name: "Marathi (मराठी)" },
  { code: "Gujarati", name: "Gujarati (ગુજરાતી)" },
  { code: "Punjabi", name: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "Urdu", name: "Urdu (اردو)" },
  { code: "Odia", name: "Odia (ଓଡ଼ିଆ)" },
  { code: "Assamese", name: "Assamese (অসমীয়া)" },
];

const ClinicalNotes = () => {
  const [transcript, setTranscript] = useState("");
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputLanguage, setInputLanguage] = useState("English");
  const [outputLanguage, setOutputLanguage] = useState("English");
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
    
    try {
      let englishTranscript = transcript;

      // Step 1: Translate input to English (if not already English)
      if (inputLanguage !== "English") {
        toast({
          title: "Processing",
          description: `Translating transcript from ${inputLanguage} to English...`,
        });

        const inputMtResponse = await fetch('http://localhost:8005/mt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: transcript,
            source: inputLanguage,
            dest: "English"
          })
        });

        if (!inputMtResponse.ok) {
          throw new Error('Failed to translate input transcript to English');
        }

        const inputMtData = await inputMtResponse.json();
        
        if (inputMtData.status === "success" && inputMtData.data?.output_text) {
          englishTranscript = inputMtData.data.output_text;
        } else {
          throw new Error('Translation to English failed');
        }
      }

      // Step 2: Generate SOAP notes in English using Gemini
      toast({
        title: "Processing",
        description: "Generating SOAP notes with AI...",
      });

      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDuYgCFGqLCKJr3b_VCYzjVTU8sUjqrMkc";
      
      const prompt = `You are a medical documentation assistant. Generate structured SOAP notes from the following clinical consultation transcript. Format the output as follows:

SUBJECTIVE:
[Patient's symptoms, complaints, and history as described by the patient]

OBJECTIVE:
[Examination findings, vital signs, and observable data]

ASSESSMENT:
[Clinical diagnosis or impression]

PLAN:
[Treatment plan, medications, follow-up instructions]

Consultation Transcript:
${englishTranscript}

Please provide only the SOAP notes without any additional commentary.`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        }
      );

      if (!geminiResponse.ok) {
        throw new Error('Failed to generate SOAP notes with Gemini');
      }

      const geminiData = await geminiResponse.json();
      const englishSoapNotes = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!englishSoapNotes) {
        throw new Error('No SOAP notes generated');
      }

      // Step 3: Translate SOAP notes to output language (if not English)
      if (outputLanguage === "English") {
        setGeneratedNotes(englishSoapNotes);
        toast({
          title: "Success",
          description: "Clinical notes generated successfully",
        });
      } else {
        toast({
          title: "Processing",
          description: `Translating SOAP notes to ${outputLanguage}...`,
        });

        const outputMtResponse = await fetch('http://localhost:8005/mt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: englishSoapNotes,
            source: "English",
            dest: outputLanguage
          })
        });

        if (!outputMtResponse.ok) {
          throw new Error('Failed to translate SOAP notes');
        }

        const outputMtData = await outputMtResponse.json();
        
        if (outputMtData.status === "success" && outputMtData.data?.output_text) {
          setGeneratedNotes(outputMtData.data.output_text);
          toast({
            title: "Success",
            description: `Clinical notes generated and translated to ${outputLanguage}`,
          });
        } else {
          // Fallback to English if translation fails
          setGeneratedNotes(englishSoapNotes);
          toast({
            title: "Warning",
            description: "Translation failed, showing English version",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error generating SOAP notes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate SOAP notes",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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
                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Languages className="h-4 w-4" />
                    Input Language
                  </label>
                  <Select value={inputLanguage} onValueChange={setInputLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select input language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Languages className="h-4 w-4" />
                    Output Language
                  </label>
                  <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select output language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Textarea
                  value={generatedNotes}
                  readOnly
                  className="min-h-[350px] font-mono text-sm bg-muted"
                  placeholder="Generated SOAP notes will appear here..."
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-muted-foreground">
                    <p>Input: <span className="font-semibold">{inputLanguage}</span></p>
                    <p>Output: <span className="font-semibold">{outputLanguage}</span></p>
                  </div>
                  {generatedNotes && (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Notes generated successfully
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClinicalNotes;
