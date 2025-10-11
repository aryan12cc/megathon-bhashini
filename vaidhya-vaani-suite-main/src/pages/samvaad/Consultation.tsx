import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
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

type Chunk = {
  id: number;
  text: string;
  audioBlob?: Blob;
  ttsAudioUrl?: string;
  isLast?: boolean;
};

type SpeakerModule = "doctor" | "patient";

// Language options based on your API mappings
const LANGUAGES = [
  { value: "hindi", label: "Hindi (हिंदी)" },
  { value: "english", label: "English" },
  { value: "bengali", label: "Bengali (বাংলা)" },
  { value: "gujarati", label: "Gujarati (ગુજરાતી)" },
  { value: "kannada", label: "Kannada (ಕನ್ನಡ)" },
  { value: "malayalam", label: "Malayalam (മലയാളം)" },
  { value: "marathi", label: "Marathi (मराठी)" },
  { value: "odia", label: "Odia (ଓଡ଼ିଆ)" },
  { value: "punjabi", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { value: "tamil", label: "Tamil (தமிழ்)" },
  { value: "telugu", label: "Telugu (తెలుగు)" },
];

const Consultation = () => {
  const [activeRecorder, setActiveRecorder] = useState<SpeakerModule | null>(null);
  const [doctorChunks, setDoctorChunks] = useState<Chunk[]>([]);
  const [patientChunks, setPatientChunks] = useState<Chunk[]>([]);
  const [isPlayingDoctor, setIsPlayingDoctor] = useState(false);
  const [isPlayingPatient, setIsPlayingPatient] = useState(false);
  const [currentPlayingChunk, setCurrentPlayingChunk] = useState<{ speaker: SpeakerModule; index: number } | null>(null);
  const [doctorLanguage, setDoctorLanguage] = useState<string>("english");
  const [patientLanguage, setPatientLanguage] = useState<string>("hindi");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chunkCounterRef = useRef(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const playQueueRef = useRef<{ speaker: SpeakerModule; chunks: Chunk[] }>({ speaker: "doctor", chunks: [] });

  // Send audio chunk to backend
  const sendAudioChunk = async (audioBlob: Blob, speaker: SpeakerModule, chunkId: number, isLast: boolean) => {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    formData.append("speaker", speaker);
    formData.append("chunkId", chunkId.toString());
    formData.append("isLast", isLast.toString());
    
    // Add language information
    const speakerLanguage = speaker === "doctor" ? doctorLanguage : patientLanguage;
    const targetLanguage = speaker === "doctor" ? patientLanguage : doctorLanguage;
    formData.append("sourceLanguage", speakerLanguage);
    formData.append("targetLanguage", targetLanguage);

    try {
      // TODO: Replace with actual backend endpoint
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      // Update chunks with transcription
      const newChunk: Chunk = {
        id: chunkId,
        text: data.transcription,
        audioBlob,
        ttsAudioUrl: data.ttsAudioUrl,
        isLast,
      };

      if (speaker === "doctor") {
        setDoctorChunks(prev => [...prev, newChunk]);
      } else {
        setPatientChunks(prev => [...prev, newChunk]);
      }
    } catch (error) {
      console.error("Error sending audio chunk:", error);
      toast.error("Failed to transcribe audio");
    }
  };

  // Start recording
  const startRecording = async (speaker: SpeakerModule) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      chunkCounterRef.current = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const chunkId = chunkCounterRef.current++;
          
          sendAudioChunk(audioBlob, speaker, chunkId, false);
          audioChunksRef.current = []; // Reset for next chunk
        }
      };

      mediaRecorder.onstop = () => {
        // Send last chunk if any data remains
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const chunkId = chunkCounterRef.current++;
          sendAudioChunk(audioBlob, speaker, chunkId, true);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(5000); // 5 second chunks
      setActiveRecorder(speaker);
      toast.success(`${speaker === "doctor" ? "Doctor" : "Patient"} recording started`);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setActiveRecorder(null);
      toast.success("Recording stopped");
    }
  };

  // Toggle recording
  const toggleRecording = (speaker: SpeakerModule) => {
    if (activeRecorder === speaker) {
      stopRecording();
    } else if (!activeRecorder) {
      startRecording(speaker);
    }
  };

  // Play TTS chunks sequentially
  const playChunks = (speaker: SpeakerModule) => {
    const chunks = speaker === "doctor" ? patientChunks : doctorChunks;
    const oppositeSpeaker = speaker === "doctor" ? "patient" : "doctor";
    
    if (chunks.length === 0) return;

    playQueueRef.current = { speaker: oppositeSpeaker, chunks };
    
    if (speaker === "doctor") {
      setIsPlayingPatient(true);
    } else {
      setIsPlayingDoctor(true);
    }

    playNextChunk(oppositeSpeaker, 0);
  };

  const playNextChunk = (speaker: SpeakerModule, index: number) => {
    const chunks = speaker === "doctor" ? doctorChunks : patientChunks;
    
    if (index >= chunks.length) {
      // Check if last chunk is available
      const lastChunk = chunks[chunks.length - 1];
      if (lastChunk?.isLast) {
        // All chunks played, stop
        stopPlayback(speaker);
      }
      return;
    }

    const chunk = chunks[index];
    
    if (!chunk.ttsAudioUrl) {
      // Wait for TTS to be ready
      setTimeout(() => playNextChunk(speaker, index), 500);
      return;
    }

    setCurrentPlayingChunk({ speaker, index });

    const audio = new Audio(chunk.ttsAudioUrl);
    audioElementRef.current = audio;

    audio.onended = () => {
      if (chunk.isLast) {
        stopPlayback(speaker);
      } else {
        playNextChunk(speaker, index + 1);
      }
    };

    audio.onerror = () => {
      console.error("Error playing audio chunk");
      playNextChunk(speaker, index + 1);
    };

    audio.play();
  };

  const stopPlayback = (speaker: SpeakerModule) => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    
    if (speaker === "doctor") {
      setIsPlayingDoctor(false);
    } else {
      setIsPlayingPatient(false);
    }
    
    setCurrentPlayingChunk(null);
  };

  // Check if can show listen button
  const canShowListen = (speaker: SpeakerModule) => {
    const chunks = speaker === "doctor" ? patientChunks : doctorChunks;
    return chunks.length > 0 && chunks.some(c => c.isLast);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  const SpeakerModule = ({ speaker, title }: { speaker: SpeakerModule; title: string }) => {
    const isRecording = activeRecorder === speaker;
    const isOtherRecording = activeRecorder !== null && activeRecorder !== speaker;
    const chunks = speaker === "doctor" ? doctorChunks : patientChunks;
    const isPlaying = speaker === "doctor" ? isPlayingDoctor : isPlayingPatient;
    const selectedLanguage = speaker === "doctor" ? doctorLanguage : patientLanguage;
    const setSelectedLanguage = speaker === "doctor" ? setDoctorLanguage : setPatientLanguage;
    const oppositeChunks = speaker === "doctor" ? patientChunks : doctorChunks;

    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <Badge variant={isRecording ? "destructive" : "outline"}>
              {isRecording ? "Recording" : "Ready"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Select Language
            </label>
            <Select
              value={selectedLanguage}
              onValueChange={setSelectedLanguage}
              disabled={isRecording || isOtherRecording}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recording Control */}
          <div className="flex items-center justify-center">
            <Button
              size="lg"
              onClick={() => toggleRecording(speaker)}
              disabled={isOtherRecording}
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
          </div>

          {/* Transcription Display */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <h4 className="text-sm font-medium text-muted-foreground">Your Transcript:</h4>
            {chunks.map((chunk, index) => (
              <div key={chunk.id} className="p-2 bg-primary/5 rounded-md">
                <p className="text-sm">{chunk.text}</p>
                {chunk.isLast && (
                  <Badge variant="secondary" className="mt-1 text-xs">Last Chunk</Badge>
                )}
              </div>
            ))}
            {chunks.length === 0 && (
              <p className="text-sm text-muted-foreground">No transcription yet...</p>
            )}
          </div>

          {/* Listen Control */}
          {canShowListen(speaker) && !isPlaying && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => playChunks(speaker)}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Listen to {speaker === "doctor" ? "Patient" : "Doctor"}
            </Button>
          )}

          {isPlaying && (
            <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-md">
              <div className="flex items-center gap-2">
                <VolumeX className="h-4 w-4 animate-pulse" />
                <span className="text-sm">Playing...</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => stopPlayback(speaker)}
              >
                Stop
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Clinical Consultation Room</h1>
            <p className="text-muted-foreground">
              Real-time doctor-patient conversation with live transcription and translation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <SpeakerModule speaker="doctor" title="Doctor Module" />
            <SpeakerModule speaker="patient" title="Patient Module" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Consultation;
