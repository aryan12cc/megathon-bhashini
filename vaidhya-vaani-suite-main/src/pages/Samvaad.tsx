import { Video, UserPlus, Pill } from "lucide-react";
import Navbar from "@/components/Navbar";
import FeatureCard from "@/components/FeatureCard";
import { useLanguage } from "@/contexts/LanguageContext";

const Samvaad = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      title: t('samvaad.consultation.title'),
      description: t('samvaad.consultation.description'),
      icon: Video,
      path: "/samvaad/consultation",
      badge: t('samvaad.consultation.badge'),
    },
    {
      title: t('samvaad.triage.title'),
      description: t('samvaad.triage.description'),
      icon: UserPlus,
      path: "/samvaad/triage",
      badge: t('samvaad.triage.badge'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            {t('samvaad.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('samvaad.subtitle')}
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

export default Samvaad;
