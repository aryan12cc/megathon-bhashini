import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, Play, Pause } from "lucide-react";
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

type TranscriptResult = {
  originalText: string;
  translatedText: string;
  audioUrl: string;
};

// Language options based on your API mappings
const LANGUAGES = [
  { value: "Hindi", label: "Hindi (हिंदी)" },
  { value: "English", label: "English" },
  { value: "Bengali", label: "Bengali (বাংলা)" },
  { value: "Gujarati", label: "Gujarati (ગુજરાતી)" },
  { value: "Kannada", label: "Kannada (ಕನ್ನಡ)" },
  { value: "Malayalam", label: "Malayalam (മലയാളം)" },
  { value: "Marathi", label: "Marathi (मराठी)" },
  { value: "Odia", label: "Odia (ଓଡ଼ିଆ)" },
  { value: "Punjabi", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { value: "Tamil", label: "Tamil (தமிழ்)" },
  { value: "Telugu", label: "Telugu (తెలుగు)" },
];

const Consultation = () => {
  const [activeRecorder, setActiveRecorder] = useState<SpeakerModule | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [doctorResult, setDoctorResult] = useState<TranscriptResult | null>(null);
  const [patientResult, setPatientResult] = useState<TranscriptResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingDoctor, setIsPlayingDoctor] = useState(false);
  const [isPlayingPatient, setIsPlayingPatient] = useState(false);
  const [doctorLanguage, setDoctorLanguage] = useState<string>("English");
  const [patientLanguage, setPatientLanguage] = useState<string>("Hindi");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Create conversation on component mount
  useEffect(() => {
    createNewConversation();
  }, []);

  const createNewConversation = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/conversations/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userID: `user_${Date.now()}`,
          userLanguage: patientLanguage,
          personLanguage: doctorLanguage,
        }),
      });

      const data = await response.json();
      if (data.convoID) {
        setConversationId(data.convoID);
        toast.success("Conversation session started");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to start conversation session");
    }
  };

  // Helper function to convert blob to WAV and save properly
  const saveAudioAsWAV = async (audioBlob: Blob, speaker: SpeakerModule) => {
    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Create a proper WAV file with headers
      const wavBlob = await convertToWAV(arrayBuffer);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${speaker}_recording_${timestamp}.wav`;
      
      // Save to s2s folder via server
      const formData = new FormData();
      formData.append('audio', wavBlob, filename);
      formData.append('speaker', speaker);
      return;
      const response = await fetch('http://localhost:8001/save-audio', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Audio saved to server:', result.file_path);
        return result.file_path;
      } else {
        throw new Error('Failed to save audio to server');
      }
    } catch (error) {
      console.error('Error saving audio:', error);
      // Fallback: save locally
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${speaker}_recording_${timestamp}.wav`;
      
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`Audio downloaded locally as: ${filename}`);
      return null;
    }
  };

  // Convert audio buffer to proper WAV format
  const convertToWAV = async (arrayBuffer: ArrayBuffer): Promise<Blob> => {
    try {
      // Create audio context with the correct sample rate
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      
      // Convert to WAV format preserving original sample rate
      const wav = encodeWAV(audioBuffer);
      return new Blob([wav], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error converting to WAV:', error);
      // Fallback: return original blob
      return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
  };

  // WAV encoding function with correct parameters
  const encodeWAV = (audioBuffer: AudioBuffer): ArrayBuffer => {
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate; // Use original sample rate
    const numberOfChannels = 1; // Always encode as mono to avoid issues
    const bytesPerSample = 2; // 16-bit
    const byteRate = sampleRate * numberOfChannels * bytesPerSample;
    const blockAlign = numberOfChannels * bytesPerSample;
    const dataSize = length * numberOfChannels * bytesPerSample;
    
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);
    let pos = 0;

    // WAV header
    const writeString = (str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(pos++, str.charCodeAt(i));
      }
    };

    const writeUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    const writeUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    // RIFF chunk descriptor
    writeString('RIFF');
    writeUint32(36 + dataSize); // ChunkSize
    writeString('WAVE');

    // fmt sub-chunk
    writeString('fmt ');
    writeUint32(16); // Subchunk1Size for PCM
    writeUint16(1); // AudioFormat (PCM)
    writeUint16(numberOfChannels); // Mono
    writeUint32(sampleRate);
    writeUint32(byteRate);
    writeUint16(blockAlign);
    writeUint16(16); // BitsPerSample

    // data sub-chunk
    writeString('data');
    writeUint32(dataSize);

    // Write audio data - always convert to mono
    const originalChannels = audioBuffer.numberOfChannels;
    if (originalChannels === 1) {
      // Already mono
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        pos += 2;
      }
    } else {
      // Multi-channel - mix down to mono by averaging all channels
      for (let i = 0; i < length; i++) {
        let sample = 0;
        for (let channel = 0; channel < originalChannels; channel++) {
          sample += audioBuffer.getChannelData(channel)[i];
        }
        sample /= originalChannels; // Average all channels
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        pos += 2;
      }
    }

    return arrayBuffer;
  };

  // Process recorded audio through individual API calls
  const processAudioWithS2S = async (audioBlob: Blob, speaker: SpeakerModule) => {
    if (!conversationId) {
      toast.error("No conversation session available");
      return;
    }

    setIsProcessing(true);
    
    try {
      const sourceLanguage = speaker === "doctor" ? doctorLanguage : patientLanguage;
      const targetLanguage = speaker === "doctor" ? patientLanguage : doctorLanguage;
      
      console.log(`Processing ${speaker} audio: ${sourceLanguage} -> ${targetLanguage}`);
      
      // Save the audio file as proper WAV format
      const savedFilePath = await saveAudioAsWAV(audioBlob, speaker);
      if (savedFilePath) {
        console.log('Audio saved to:', savedFilePath);
      }
      
      // Step 1: Convert audio to text using ASR
      const asrFormData = new FormData();
      asrFormData.append('audio_file', audioBlob, 'recording.wav');
      asrFormData.append('Language', sourceLanguage);

      console.log('Calling ASR API with language:', sourceLanguage);
      const asrResponse = await fetch('http://localhost:8002/asr', {
        method: 'POST',
        body: asrFormData,
      });

      if (!asrResponse.ok) {
        const errorText = await asrResponse.text();
        console.error('ASR Response error:', errorText);
        throw new Error(`ASR processing failed: ${errorText}`);
      }

      const asrResult = await asrResponse.json();
      console.log('ASR Result:', asrResult);
      let originalText = '';
      
      if (asrResult.status === 'success' && asrResult.data?.recognized_text) {
        originalText = asrResult.data.recognized_text;
      } else if (asrResult.recognized_text) {
        originalText = asrResult.recognized_text;
      } else {
        throw new Error('No text recognized from audio');
      }

      // Step 2: Translate text using MT
      const mtResponse = await fetch('http://localhost:8002/mt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: originalText,
          source: sourceLanguage,
          dest: targetLanguage
        }),
      });

      let translatedText = '';
      
      if (mtResponse.ok) {
        const mtResult = await mtResponse.json();
        
        if (mtResult.status === 'success' && mtResult.data?.output_text) {
          translatedText = mtResult.data.output_text;
        } else if (mtResult.output_text) {
          translatedText = mtResult.output_text;
        } else {
          console.warn('Translation API returned success but no text, using original');
          translatedText = originalText;
        }
      } else {
        const errorText = await mtResponse.text();
        console.warn('Translation failed, using original text. Error:', errorText);
        translatedText = originalText; // Fallback to original text
      }

      // Step 3: Generate audio using TTS
      const ttsResponse = await fetch('http://localhost:8002/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: translatedText,
          Language: targetLanguage
        }),
      });

      let audioUrl = '';
      if (ttsResponse.ok) {
        const ttsResult = await ttsResponse.json();
        if (ttsResult.status === 'success' && ttsResult.data?.s3_url) {
          audioUrl = ttsResult.data.s3_url;
        } else if (ttsResult.s3_url) {
          audioUrl = ttsResult.s3_url;
        }
      } else {
        const errorText = await ttsResponse.text();
        console.warn('TTS failed, continuing without audio:', errorText);
      }
      
      // Step 4: Add message to conversation
      await fetch(`http://localhost:8000/api/conversations/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          convoID: conversationId,
          speaker: speaker,
          originalText: originalText,
          originalLanguage: sourceLanguage,
          translatedText: translatedText,
          translatedLanguage: targetLanguage,
          translatedText_EN: translatedText,
          translatedLanguage_EN: "English"
        }),
      });

      // Store the result
      const result: TranscriptResult = {
        originalText: originalText,
        translatedText: translatedText,
        audioUrl: audioUrl
      };

      if (speaker === "doctor") {
        setDoctorResult(result);
      } else {
        setPatientResult(result);
      }

      toast.success("Audio processed successfully");
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error(`Failed to process audio: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start recording
  const startRecording = async (speaker: SpeakerModule) => {
    try {
      // Clear previous results when starting new recording
      if (speaker === "doctor") {
        setDoctorResult(null);
      } else {
        setPatientResult(null);
      }

      // Use specific audio constraints to ensure consistent recording
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Match common ASR sample rate
          channelCount: 1 // Force mono recording
        } 
      });
      
      // Create MediaRecorder with specific MIME type if supported
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Process the complete recording
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        processAudioWithS2S(audioBlob, speaker);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
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

  // Play/pause audio
  const toggleAudioPlayback = (speaker: SpeakerModule) => {
    const result = speaker === "doctor" ? doctorResult : patientResult;
    if (!result?.audioUrl) return;

    const isCurrentlyPlaying = speaker === "doctor" ? isPlayingDoctor : isPlayingPatient;
    
    if (isCurrentlyPlaying) {
      // Pause current audio
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      
      if (speaker === "doctor") {
        setIsPlayingDoctor(false);
      } else {
        setIsPlayingPatient(false);
      }
    } else {
      // Start playing audio
      const audio = new Audio(result.audioUrl);
      audioElementRef.current = audio;
      
      audio.onended = () => {
        if (speaker === "doctor") {
          setIsPlayingDoctor(false);
        } else {
          setIsPlayingPatient(false);
        }
        audioElementRef.current = null;
      };

      audio.onerror = () => {
        toast.error("Error playing audio");
        if (speaker === "doctor") {
          setIsPlayingDoctor(false);
        } else {
          setIsPlayingPatient(false);
        }
        audioElementRef.current = null;
      };

      if (speaker === "doctor") {
        setIsPlayingDoctor(true);
      } else {
        setIsPlayingPatient(true);
      }
      
      audio.play();
    }
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
    const result = speaker === "doctor" ? doctorResult : patientResult;
    const isPlaying = speaker === "doctor" ? isPlayingDoctor : isPlayingPatient;
    const selectedLanguage = speaker === "doctor" ? doctorLanguage : patientLanguage;
    const setSelectedLanguage = speaker === "doctor" ? setDoctorLanguage : setPatientLanguage;

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
              disabled={isRecording || isOtherRecording || isProcessing}
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
              disabled={isOtherRecording || isProcessing}
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

          {/* Processing indicator */}
          {isProcessing && activeRecorder === speaker && (
            <div className="text-center text-sm text-muted-foreground">
              Processing audio...
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4 p-4 bg-primary/5 rounded-md">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Original Text:</h4>
                <p className="text-sm">{result.originalText}</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Translation:</h4>
                <p className="text-sm">{result.translatedText}</p>
              </div>

              {/* Audio playback control */}
              <div className="flex items-center justify-center">
                <Button
                  variant="outline"
                  onClick={() => toggleAudioPlayback(speaker)}
                  disabled={isProcessing}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Translation
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Play Translation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* No results message */}
          {!result && !isProcessing && (
            <p className="text-sm text-muted-foreground text-center">
              No recording yet. Start recording to see transcription and translation.
            </p>
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
