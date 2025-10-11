import { useState } from "react";
import { Mic, MicOff, Tag } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const Consultation = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; isMarked?: boolean }>>([
    { speaker: "Doctor", text: "How are you feeling today?" },
    { speaker: "Patient", text: "मुझे सिरदर्द और बुखार है (I have headache and fever)" },
    { speaker: "Translation", text: "I have headache and fever" },
  ]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Integrate with Bhashini ASR API for real-time transcription
    // API endpoint: https://bhashini.gov.in/asr
    // Required: Audio stream, source language, target language
    toast(isRecording ? "Recording stopped" : "Recording started");
  };

  const markAsKeyPoint = (index: number) => {
    setTranscript(prev => 
      prev.map((item, i) => i === index ? { ...item, isMarked: true } : item)
    );
    toast.success("Marked as key point");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Clinical Consultation Room</h1>
            <p className="text-muted-foreground">
              Real-time doctor-patient conversation with live transcription and translation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Patient Vitals Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient Vitals</CardTitle>
                <CardDescription>Real-time monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blood Pressure:</span>
                  <span className="font-medium">120/80 mmHg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heart Rate:</span>
                  <span className="font-medium">72 bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temperature:</span>
                  <span className="font-medium text-warning">100.4°F</span>
                </div>
                {/* TODO: Integrate with EMR system for real-time vitals */}
              </CardContent>
            </Card>

            {/* Recording Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recording Controls</CardTitle>
                <CardDescription>Conversation capture</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <Button
                  size="lg"
                  onClick={toggleRecording}
                  className={isRecording ? "bg-destructive hover:bg-destructive/90" : "bg-gradient-primary"}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="mr-2 h-5 w-5" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Start Recording
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Transcript Display */}
          <Card>
            <CardHeader>
              <CardTitle>Live Transcript</CardTitle>
              <CardDescription>
                Real-time conversation with translation (Hindi ↔ English)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {transcript.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    item.speaker === "Doctor" ? "bg-primary/5" : 
                    item.speaker === "Patient" ? "bg-secondary/5" : "bg-muted"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{item.speaker}</Badge>
                      {item.isMarked && (
                        <Badge variant="secondary" className="gap-1">
                          <Tag className="h-3 w-3" />
                          Key Point
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{item.text}</p>
                  </div>
                  {item.speaker !== "Translation" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsKeyPoint(index)}
                      disabled={item.isMarked}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {/* TODO: Implement real-time ASR with Bhashini API */}
              {/* TODO: Implement real-time translation with Bhashini MT API */}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Consultation;
