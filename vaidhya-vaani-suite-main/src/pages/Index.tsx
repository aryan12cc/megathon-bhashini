import { MessageSquare, FileText, Brain, GraduationCap } from "lucide-react";
import ModuleCard from "@/components/ModuleCard";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();
  
  const modules = [
    {
      title: t('index.samvaad.title'),
      description: t('index.samvaad.description'),
      icon: MessageSquare,
      path: "/samvaad",
      gradient: "bg-gradient-primary",
    },
    {
      title: t('index.lipiGyan.title'),
      description: t('index.lipiGyan.description'),
      icon: FileText,
      path: "/lipi-gyan",
      gradient: "bg-gradient-secondary",
    },
    {
      title: t('index.saaransh.title'),
      description: t('index.saaransh.description'),
      icon: Brain,
      path: "/saaransh",
      gradient: "bg-accent",
    },
    {
      title: t('index.siksha.title'),
      description: t('index.siksha.description'),
      icon: GraduationCap,
      path: "/siksha",
      gradient: "bg-gradient-hero",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container py-12 md:py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            {t('index.hero.title')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('index.hero.subtitle')}
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {modules.map((module) => (
            <ModuleCard key={module.path} {...module} />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">10+</div>
              <div className="text-sm text-muted-foreground">{t('index.stats.tools')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary mb-2">22</div>
              <div className="text-sm text-muted-foreground">{t('index.stats.languages')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">4</div>
              <div className="text-sm text-muted-foreground">{t('index.stats.modules')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">{t('index.stats.accessible')}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
