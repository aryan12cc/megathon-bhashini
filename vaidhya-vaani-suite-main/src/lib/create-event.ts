// /Users/aryan12/Desktop/IIITH/Megathon/megathon-bhashini/vaidhya-vaani-suite-main/src/lib/create-event.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

interface EventDetails {
  summary: string;
  description: string;
  start: string;
  end: string;
}

export const createCalendarEvent = async (eventDetails: EventDetails, token: string): Promise<any> => {
  const response = await fetch(`${API_URL}/api/calendar/create-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(eventDetails),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create event');
  }

  return response.json();
};
