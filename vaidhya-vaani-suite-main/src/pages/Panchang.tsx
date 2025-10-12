import { BookOpen, Video } from "lucide-react";
import Navbar from "@/components/Navbar";
import FeatureCard from "@/components/FeatureCard";
import { useLanguage } from "@/contexts/LanguageContext";

const Panchang = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      title: t('panchang.proactive.title'),
      description: t('panchang.proactive.description'),
      icon: BookOpen,
      path: "/panchang/proactive",
      badge: t('panchang.proactive.badge'),
    },
    {
      title: t('panchang.encyclopedia.title'),
      description: t('panchang.encyclopedia.description'),
      icon: Video,
      path: "/panchang/encyclopedia",
      badge: t('panchang.encyclopedia.badge'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            {t('panchang.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('panchang.subtitle')}
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

export default Panchang;
