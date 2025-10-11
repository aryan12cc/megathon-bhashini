import { BookOpen, Video } from "lucide-react";
import Navbar from "@/components/Navbar";
import FeatureCard from "@/components/FeatureCard";
import { useLanguage } from "@/contexts/LanguageContext";

const Siksha = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      title: t('siksha.proactive.title'),
      description: t('siksha.proactive.description'),
      icon: BookOpen,
      path: "/siksha/proactive",
      badge: t('siksha.proactive.badge'),
    },
    {
      title: t('siksha.encyclopedia.title'),
      description: t('siksha.encyclopedia.description'),
      icon: Video,
      path: "/siksha/encyclopedia",
      badge: t('siksha.encyclopedia.badge'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            {t('siksha.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('siksha.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          {features.map((feature) => (
            <FeatureCard key={feature.path} {...feature} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Siksha;
