import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  gradient: string;
}

const ModuleCard = ({ title, description, icon: Icon, path, gradient }: ModuleCardProps) => {
  return (
    <Card className="group overflow-hidden border-2 transition-all hover:shadow-medium hover:border-primary/50">
      <CardHeader>
        <div className={`inline-flex w-fit rounded-lg p-3 ${gradient}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to={path}>
          <Button variant="ghost" className="group-hover:bg-primary/10 group-hover:text-primary">
            Explore
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ModuleCard;
