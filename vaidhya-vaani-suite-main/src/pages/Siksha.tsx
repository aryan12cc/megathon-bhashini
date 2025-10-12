import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { createCalendarEvent } from "@/lib/create-event";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const Siksha = () => {
  const { t } = useLanguage();
  const { token, user } = useAuth();
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [calendarVersion, setCalendarVersion] = useState(0);

  const calendarSrc = user
    ? `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
        user.email
      )}&ctz=Asia%2FKolkata`
    : "https://calendar.google.com/calendar/embed?src=en.indian%23holiday%40group.v.calendar.google.com&ctz=Asia%2FKolkata";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("You must be logged in to create an event.");
      return;
    }

    const eventDetails = {
      summary,
      description,
      start: startTime,
      end: endTime,
    };

    try {
      await createCalendarEvent(eventDetails, token);
      toast.success("Event created successfully!");
      setSummary("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setIsDialogOpen(false);

      setTimeout(() => {
        setCalendarVersion(prevVersion => prevVersion + 1);
      }, 1000);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create event. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-12">
        <div className="max-w-5xl mx-auto mb-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-4 text-foreground">
                {t('siksha.title')}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t('siksha.subtitle')}
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Event to Calendar</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create a New Calendar Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="summary" className="text-right">
                        Title
                      </Label>
                      <Input
                        id="summary"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="col-span-3"
                        placeholder="Event Title"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="col-span-3"
                        placeholder="Event Description"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="start-time" className="text-right">
                        Start Time
                      </Label>
                      <Input
                        id="start-time"
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="end-time" className="text-right">
                        End Time
                      </Label>
                      <Input
                        id="end-time"
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="col-span-3"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit">Create Event</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div style={{ height: '70vh', width: '100%' }}>
            <iframe 
              key={calendarVersion}
              src={calendarSrc}
              style={{border: 0, width: '100%', height: '100%'}} 
              frameBorder="0" 
              scrolling="no"
              className="rounded-lg shadow-lg"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Siksha;
