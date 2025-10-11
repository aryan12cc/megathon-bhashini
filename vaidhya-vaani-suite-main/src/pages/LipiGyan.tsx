import { Pill, FlaskConical, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import FeatureCard from "@/components/FeatureCard";
import { useLanguage } from "@/contexts/LanguageContext";

const LipiGyan = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      title: t('lipiGyan.prescription.title'),
      description: t('lipiGyan.prescription.description'),
      icon: Pill,
      path: "/lipi-gyan/prescription",
      badge: t('lipiGyan.prescription.badge'),
    },
    {
      title: t('lipiGyan.labReport.title'),
      description: t('lipiGyan.labReport.description'),
      icon: FlaskConical,
      path: "/lipi-gyan/lab-report",
      badge: t('lipiGyan.labReport.badge'),
    },
    {
      title: t('lipiGyan.discharge.title'),
      description: t('lipiGyan.discharge.description'),
      icon: FileText,
      path: "/lipi-gyan/discharge",
      badge: t('lipiGyan.discharge.badge'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="container py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            {t('lipiGyan.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('lipiGyan.subtitle')}
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

export default LipiGyan;
