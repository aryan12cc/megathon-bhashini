import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, Copy } from "lucide-react";
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
  isBlobUrl?: boolean; // Track if this is a blob URL that needs cleanup
};

type ConversationMessage = {
  speaker: SpeakerModule;
  text: string;
  timestamp: Date;
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
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [displayLanguage, setDisplayLanguage] = useState<string>("English");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set()); // Track blob URLs for cleanup

  // Create conversation on component mount
  useEffect(() => {
    createNewConversation();
  }, []);

  const createNewConversation = async () => {
    try {
      const databaseUrl = import.meta.env.VITE_DATABASE_URL || 'http://localhost:8002';
      const response = await fetch(`${databaseUrl}/api/conversations/new`, {
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

  // Cleanup function for blob URLs
  const cleanupBlobUrl = (url: string) => {
    if (url.startsWith('blob:') && blobUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
      console.log('Cleaned up blob URL:', url);
    }
  };

  // Helper function to convert blob to WAV and save properly
  const saveAudioAsWAV = async (audioBlob: Blob, speaker: SpeakerModule) => {
    try {
      console.log(`Saving audio for ${speaker}, blob size:`, audioBlob.size);
      
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Audio blob is empty or null');
      }

      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log('Array buffer size:', arrayBuffer.byteLength);
      
      // Create a proper WAV file with headers
      const wavBlob = await convertToWAV(arrayBuffer);
      console.log('WAV blob size:', wavBlob.size);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${speaker}_recording_${timestamp}.wav`;
      
      // Save to s2s folder via server
      const formData = new FormData();
      formData.append('audio', wavBlob, filename);
      formData.append('speaker', speaker);
      
      // Try to save to server (commented out the early return)
      try {
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
      } catch (serverError) {
        console.warn('Server save failed, falling back to local save:', serverError);
        // Fallback to local save
        throw serverError;
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
      console.log('Converting to WAV, input buffer size:', arrayBuffer.byteLength);
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Input array buffer is empty');
      }

      // Create audio context with the correct sample rate
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      
      console.log('Audio buffer decoded:', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        length: audioBuffer.length
      });
      
      if (audioBuffer.length === 0) {
        throw new Error('Decoded audio buffer is empty');
      }
      
      // Convert to WAV format preserving original sample rate
      const wav = encodeWAV(audioBuffer);
      const wavBlob = new Blob([wav], { type: 'audio/wav' });
      
      console.log('WAV conversion successful, output size:', wavBlob.size);
      return wavBlob;
    } catch (error) {
      console.error('Error converting to WAV:', error);
      console.log('Falling back to original blob with WAV type');
      // Fallback: return original blob with WAV type
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

    console.log(`Starting processAudioWithS2S for ${speaker}`);
    console.log('Audio blob details:', {
      size: audioBlob?.size,
      type: audioBlob?.type,
      isNull: audioBlob === null,
      isUndefined: audioBlob === undefined
    });

    // Validate audio blob
    if (!audioBlob || audioBlob.size === 0) {
      console.error('Audio blob is null, undefined, or empty');
      toast.error("No audio data recorded. Please try recording again.");
      return;
    }

    setIsProcessing(true);
    
    try {
      const sourceLanguage = speaker === "doctor" ? doctorLanguage : patientLanguage;
      const targetLanguage = speaker === "doctor" ? patientLanguage : doctorLanguage;
      
      console.log(`Processing ${speaker} audio: ${sourceLanguage} -> ${targetLanguage}`);
      
      // Save the audio file as proper WAV format
      console.log('Attempting to save audio as WAV...');
      const savedFilePath = await saveAudioAsWAV(audioBlob, speaker);
      if (savedFilePath) {
        console.log('Audio saved to:', savedFilePath);
      } else {
        console.log('Audio saved locally (server save failed)');
      }
      
      // Convert the audio blob to WAV format for ASR API
      let processedAudioBlob;
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        processedAudioBlob = await convertToWAV(arrayBuffer);
        console.log('Converted to WAV for ASR. Size:', processedAudioBlob.size);
      } catch (conversionError) {
        console.warn('WAV conversion failed, using original blob:', conversionError);
        processedAudioBlob = audioBlob;
      }
      
      // Step 1: Convert audio to text using ASR
      const asrFormData = new FormData();
      asrFormData.append('audio_file', processedAudioBlob, 'recording.wav');
      asrFormData.append('Language', sourceLanguage);

      console.log('Calling ASR API with language:', sourceLanguage);
      console.log('FormData audio file size:', processedAudioBlob.size);
      
      const asrResponse = await fetch('http://localhost:8005/asr', {
        method: 'POST',
        body: asrFormData,
      });
      console.log('ASR API response status:', asrResponse);
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
      const mtResponse = await fetch('http://localhost:8005/mt', {
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
      const ttsResponse = await fetch('http://localhost:8005/tts', {
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
        console.log('TTS Result:', ttsResult);
        console.log('TTS Result structure:', JSON.stringify(ttsResult, null, 2));
        
        // Handle new Base64 format - check multiple possible locations
        let base64Audio = '';
        
        // Check all possible locations for base64 data
        if (ttsResult.status === 'success' && ttsResult.data?.audio_base64) {
          base64Audio = ttsResult.data.audio_base64;
          console.log('Found base64 in ttsResult.data.audio_base64');
        } else if (ttsResult.data?.base64) {
          base64Audio = ttsResult.data.base64;
          console.log('Found base64 in ttsResult.data.base64');
        } else if (ttsResult.data?.audio) {
          base64Audio = ttsResult.data.audio;
          console.log('Found base64 in ttsResult.data.audio');
        } else if (ttsResult.base64) {
          base64Audio = ttsResult.base64;
          console.log('Found base64 in ttsResult.base64');
        } else if (ttsResult.audio) {
          base64Audio = ttsResult.audio;
          console.log('Found base64 in ttsResult.audio');
        } else if (ttsResult.audio_base64) {
          base64Audio = ttsResult.audio_base64;
          console.log('Found base64 in ttsResult.audio_base64');
        } else if (ttsResult.status === 'success' && ttsResult.data?.s3_url) {
          // Fallback to old s3_url format if base64 not available
          audioUrl = ttsResult.data.s3_url;
          console.log('Using S3 URL from ttsResult.data.s3_url');
        } else if (ttsResult.data?.audio_url) {
          // Check for audio_url as well
          audioUrl = ttsResult.data.audio_url;
          console.log('Using audio URL from ttsResult.data.audio_url');
        } else if (ttsResult.s3_url) {
          // Fallback to old s3_url format if base64 not available
          audioUrl = ttsResult.s3_url;
          console.log('Using S3 URL from ttsResult.s3_url');
        }
        
        console.log('Base64 audio length:', base64Audio ? base64Audio.length : 0);
        
        // Convert Base64 to blob URL if base64 data is available
        if (base64Audio && base64Audio.length > 0) {
          try {
            console.log('Converting Base64 to audio blob...');
            console.log('Base64 preview (first 100 chars):', base64Audio.substring(0, 100));
            
            // Remove data URL prefix if present (e.g., "data:audio/wav;base64,")
            const base64Data = base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;
            console.log('Base64 data after prefix removal length:', base64Data.length);
            
            // Validate base64 format
            if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
              throw new Error('Invalid base64 format');
            }
            
            // Convert base64 to binary
            const binaryString = atob(base64Data);
            console.log('Binary string length:', binaryString.length);
            
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Try different audio MIME types
            const possibleTypes = [
              'audio/wav',
              'audio/mpeg',
              'audio/mp3',
              'audio/ogg',
              'audio/webm'
            ];
            
            let audioBlob;
            // Default to wav first
            audioBlob = new Blob([bytes], { type: 'audio/wav' });
            
            console.log('Audio blob created:', {
              size: audioBlob.size,
              type: audioBlob.type
            });
            
            if (audioBlob.size === 0) {
              throw new Error('Generated audio blob is empty');
            }
            
            audioUrl = URL.createObjectURL(audioBlob);
            
            // Track blob URL for cleanup
            blobUrlsRef.current.add(audioUrl);
            
            console.log('Successfully converted Base64 to blob URL:', audioUrl);
            
            // Test if the audio can be loaded
            const testAudio = new Audio();
            testAudio.oncanplaythrough = () => {
              console.log('Audio blob is valid and can be played');
              testAudio.remove();
            };
            testAudio.onerror = (e) => {
              console.error('Audio blob validation failed:', e);
              testAudio.remove();
            };
            testAudio.src = audioUrl;
            
          } catch (base64Error) {
            console.error('Error converting Base64 to audio:', base64Error);
            console.error('Base64 error details:', {
              name: base64Error.name,
              message: base64Error.message,
              stack: base64Error.stack
            });
            console.warn('TTS Base64 conversion failed, continuing without audio');
            audioUrl = ''; // Reset to empty
          }
        } else {
          console.warn('No base64 audio data found in TTS response');
          console.log('Available fields in ttsResult:', Object.keys(ttsResult));
          if (ttsResult.data) {
            console.log('Available fields in ttsResult.data:', Object.keys(ttsResult.data));
          }
        }
      } else {
        const errorText = await ttsResponse.text();
        console.warn('TTS failed, continuing without audio:', errorText);
      }
      
      // Step 4: Add message to conversation
      const databaseUrl = import.meta.env.VITE_DATABASE_URL || 'http://localhost:8002';
      await fetch(`${databaseUrl}/api/conversations/add`, {
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
        audioUrl: audioUrl,
        isBlobUrl: audioUrl.startsWith('blob:') // Mark if this is a blob URL
      };

      // Clean up previous blob URL if speaker has a previous result
      const previousResult = speaker === "doctor" ? doctorResult : patientResult;
      if (previousResult?.audioUrl && previousResult.isBlobUrl) {
        cleanupBlobUrl(previousResult.audioUrl);
      }

      if (speaker === "doctor") {
        setDoctorResult(result);
      } else {
        setPatientResult(result);
      }

      // Add message to conversation history
      const textToDisplay = displayLanguage === sourceLanguage ? originalText : translatedText;
      setConversationHistory(prev => [...prev, {
        speaker: speaker,
        text: textToDisplay,
        timestamp: new Date()
      }]);

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
      // Clear previous results when starting new recording and clean up blob URLs
      const previousResult = speaker === "doctor" ? doctorResult : patientResult;
      if (previousResult?.audioUrl && previousResult.isBlobUrl) {
        cleanupBlobUrl(previousResult.audioUrl);
      }
      
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
        console.log('MediaRecorder data available:', {
          dataSize: event.data.size,
          dataType: event.data.type
        });
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped. Audio chunks:', audioChunksRef.current.length);
        console.log('Total chunks size:', audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0));
        
        // Process the complete recording
        if (audioChunksRef.current.length === 0) {
          console.error('No audio chunks recorded');
          toast.error("No audio was recorded. Please try again.");
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        // Use the same MIME type as recording for the blob
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        console.log('Created audio blob:', {
          size: audioBlob.size,
          type: audioBlob.type
        });
        
        if (audioBlob.size === 0) {
          console.error('Audio blob is empty');
          toast.error("Recorded audio is empty. Please try again.");
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        processAudioWithS2S(audioBlob, speaker);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      console.log('MediaRecorder started with options:', options);
      console.log('MediaRecorder MIME type:', mediaRecorder.mimeType);
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
    
    console.log('toggleAudioPlayback called for:', speaker);
    console.log('Result:', result);
    console.log('Audio URL:', result?.audioUrl);
    console.log('Audio URL type:', typeof result?.audioUrl);
    console.log('Audio URL length:', result?.audioUrl?.length);
    
    if (!result?.audioUrl) {
      console.error('No audio URL available for playback');
      toast.error("No audio available to play");
      return;
    }

    const isCurrentlyPlaying = speaker === "doctor" ? isPlayingDoctor : isPlayingPatient;
    
    if (isCurrentlyPlaying) {
      // Pause current audio
      console.log('Pausing audio for:', speaker);
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
      console.log('Starting audio playback for:', speaker);
      console.log('Creating Audio element with URL:', result.audioUrl);
      
      try {
        const audio = new Audio();
        audioElementRef.current = audio;
        
        // Add comprehensive event listeners for debugging
        audio.onloadstart = () => {
          console.log('Audio load started');
        };
        
        audio.onloadeddata = () => {
          console.log('Audio data loaded');
        };
        
        audio.oncanplay = () => {
          console.log('Audio can play');
        };
        
        audio.oncanplaythrough = () => {
          console.log('Audio can play through');
        };
        
        audio.onended = () => {
          console.log('Audio playback ended');
          if (speaker === "doctor") {
            setIsPlayingDoctor(false);
          } else {
            setIsPlayingPatient(false);
          }
          audioElementRef.current = null;
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          console.error('Audio error details:', {
            error: audio.error,
            networkState: audio.networkState,
            readyState: audio.readyState,
            src: audio.src
          });
          
          let errorMessage = "Error playing audio";
          if (audio.error) {
            switch (audio.error.code) {
              case audio.error.MEDIA_ERR_ABORTED:
                errorMessage = "Audio playback aborted";
                break;
              case audio.error.MEDIA_ERR_NETWORK:
                errorMessage = "Network error during audio playback";
                break;
              case audio.error.MEDIA_ERR_DECODE:
                errorMessage = "Audio decode error";
                break;
              case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = "Audio format not supported";
                break;
            }
          }
          
          toast.error(errorMessage);
          if (speaker === "doctor") {
            setIsPlayingDoctor(false);
          } else {
            setIsPlayingPatient(false);
          }
          audioElementRef.current = null;
        };

        // Set the source and attempt to play
        audio.src = result.audioUrl;
        console.log('Audio source set, attempting to play...');
        
        if (speaker === "doctor") {
          setIsPlayingDoctor(true);
        } else {
          setIsPlayingPatient(true);
        }
        
        // Use promise-based play for better error handling
        audio.play().then(() => {
          console.log('Audio play() succeeded');
        }).catch((playError) => {
          console.error('Audio play() failed:', playError);
          toast.error(`Failed to play audio: ${playError.message}`);
          
          if (speaker === "doctor") {
            setIsPlayingDoctor(false);
          } else {
            setIsPlayingPatient(false);
          }
          audioElementRef.current = null;
        });
        
      } catch (audioCreationError) {
        console.error('Error creating Audio element:', audioCreationError);
        toast.error("Failed to create audio player");
        
        if (speaker === "doctor") {
          setIsPlayingDoctor(false);
        } else {
          setIsPlayingPatient(false);
        }
      }
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
      // Clean up all blob URLs
      blobUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  // Update conversation history when display language changes
  const handleDisplayLanguageChange = async (newLanguage: string) => {
    setDisplayLanguage(newLanguage);
    
    // Re-translate all messages to the new display language
    const updatedHistory: ConversationMessage[] = [];
    
    for (const msg of conversationHistory) {
      const sourceLanguage = msg.speaker === "doctor" ? doctorLanguage : patientLanguage;
      
      // If the new display language matches the source language, use original text
      // Otherwise, we need to translate
      if (newLanguage === sourceLanguage) {
        // Find the original message from results
        const originalText = msg.speaker === "doctor" ? 
          (doctorResult?.originalText || msg.text) : 
          (patientResult?.originalText || msg.text);
        updatedHistory.push({
          ...msg,
          text: originalText
        });
      } else {
        // Need to translate to the new display language
        try {
          // Get the original text first
          const originalText = msg.speaker === "doctor" ? 
            (doctorResult?.originalText || msg.text) : 
            (patientResult?.originalText || msg.text);
          
          const mtResponse = await fetch('http://localhost:8005/mt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: originalText,
              source: sourceLanguage,
              dest: newLanguage
            }),
          });

          if (mtResponse.ok) {
            const mtResult = await mtResponse.json();
            const translatedText = mtResult.status === 'success' && mtResult.data?.output_text
              ? mtResult.data.output_text
              : (mtResult.output_text || originalText);
            
            updatedHistory.push({
              ...msg,
              text: translatedText
            });
          } else {
            updatedHistory.push(msg); // Keep original on error
          }
        } catch (error) {
          console.error('Error translating message:', error);
          updatedHistory.push(msg); // Keep original on error
        }
      }
    }
    
    setConversationHistory(updatedHistory);
  };

  // Copy conversation to clipboard
  const copyConversationToClipboard = async () => {
    if (conversationHistory.length === 0) {
      toast.error("No conversation to copy");
      return;
    }

    try {
      // Format the conversation as text
      const conversationText = conversationHistory
        .map((msg) => {
          const speaker = msg.speaker === "doctor" ? "Doctor" : "Patient";
          const time = msg.timestamp.toLocaleTimeString();
          return `[${time}] ${speaker}: ${msg.text}`;
        })
        .join('\n\n');

      // Copy to clipboard
      await navigator.clipboard.writeText(conversationText);
      toast.success("Conversation copied to clipboard");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy conversation");
    }
  };

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
                  disabled={isProcessing || !result.audioUrl}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Translation
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      {result.audioUrl ? "Play Translation" : "No Audio Available"}
                    </>
                  )}
                </Button>
              </div>
              
              {/* Debug info for audio URL */}
              {result.audioUrl && (
                <div className="text-xs text-muted-foreground text-center">
                  Audio: {result.isBlobUrl ? "Generated" : "External"} ({result.audioUrl.substring(0, 50)}...)
                </div>
              )}
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

          {/* Conversation History Section */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Conversation History</CardTitle>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyConversationToClipboard}
                      disabled={conversationHistory.length === 0 || isProcessing}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Conversation
                    </Button>
                    <label className="text-sm font-medium text-muted-foreground">
                      Display Language:
                    </label>
                    <Select
                      value={displayLanguage}
                      onValueChange={handleDisplayLanguageChange}
                      disabled={isProcessing}
                    >
                      <SelectTrigger className="w-[200px]">
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
                </div>
              </CardHeader>
              <CardContent>
                {conversationHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No conversation yet. Start recording to see the conversation history.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {conversationHistory.map((message, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          message.speaker === "doctor"
                            ? "bg-blue-50 dark:bg-blue-950/20 ml-0 mr-auto"
                            : "bg-green-50 dark:bg-green-950/20 mr-0 ml-auto"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Badge
                            variant={message.speaker === "doctor" ? "default" : "secondary"}
                            className="mt-1"
                          >
                            {message.speaker === "doctor" ? "Doctor" : "Patient"}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm">{message.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Consultation;
