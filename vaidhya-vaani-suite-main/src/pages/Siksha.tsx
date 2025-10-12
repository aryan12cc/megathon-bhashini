import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";

const Siksha = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-12">
        <div className="max-w-5xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            {t('siksha.title')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t('siksha.subtitle')}
          </p>
          
          <div style={{ height: '70vh', width: '100%' }}>
            <iframe 
              src="https://calendar.google.com/calendar/embed?src=en.indian%23holiday%40group.v.calendar.google.com&ctz=Asia%2FKolkata" 
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
