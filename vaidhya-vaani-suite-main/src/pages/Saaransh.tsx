import { FileCheck, ListChecks, CalendarClock } from "lucide-react";
import Navbar from "@/components/Navbar";
import FeatureCard from "@/components/FeatureCard";
import { useLanguage } from "@/contexts/LanguageContext";

const Saaransh = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      title: t('saaransh.clinicalNotes.title'),
      description: t('saaransh.clinicalNotes.description'),
      icon: FileCheck,
      path: "/saaransh/clinical-notes",
      badge: t('saaransh.clinicalNotes.badge'),
    },
    {
      title: t('saaransh.actionPlan.title'),
      description: t('saaransh.actionPlan.description'),
      icon: ListChecks,
      path: "/saaransh/action-plan",
      badge: t('saaransh.actionPlan.badge'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            {t('saaransh.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('saaransh.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.path} {...feature} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Saaransh;
