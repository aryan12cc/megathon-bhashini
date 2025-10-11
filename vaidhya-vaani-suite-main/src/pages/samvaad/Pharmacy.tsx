import { useState } from "react";
import { FileText, MessageSquare, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const Pharmacy = () => {
  const [showPrescription, setShowPrescription] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; translation?: string }>>([
    {
      sender: "Patient",
      text: "ఈ టాబ్లెట్‌తో ఏమైనా సైడ్ ఎఫెక్ట్స్ ఉన్నాయా?",
      translation: "Are there any side effects with this tablet?",
    },
  ]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    
    // TODO: Integrate Bhashini ASR+MT for voice to text and translation
    // API: Real-time transcription and translation
    setMessages([...messages, { sender: "Pharmacist", text }]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Pharmacy Connect</h1>
            <p className="text-muted-foreground">
              Clear communication with instant prescription access
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Conversation</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrescription(!showPrescription)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {showPrescription ? "Hide" : "Show"} Prescription
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        msg.sender === "Patient" ? "bg-secondary/10" : "bg-primary/10"
                      }`}
                    >
                      <Badge variant="outline" className="mb-2">
                        {msg.sender}
                      </Badge>
                      <p className="text-sm mb-1">{msg.text}</p>
                      {msg.translation && (
                        <p className="text-sm text-muted-foreground italic">
                          {msg.translation}
                        </p>
                      )}
                    </div>
                  ))}
                  {/* TODO: Implement real-time translation display */}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const input = document.querySelector('input') as HTMLInputElement;
                      handleSendMessage(input.value);
                      input.value = '';
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Prescription Display */}
            {showPrescription && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Prescription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium text-sm mb-1">Paracetamol 650mg</p>
                    <p className="text-xs text-muted-foreground">3 times daily, After food</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium text-sm mb-1">Amoxicillin 500mg</p>
                    <p className="text-xs text-muted-foreground">2 times daily, Before food</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium text-sm mb-1">Vitamin D3 1000IU</p>
                    <p className="text-xs text-muted-foreground">Once daily, Morning</p>
                  </div>
                  {/* TODO: Pull from Lipi-Gyan prescription decoder data */}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pharmacy;
