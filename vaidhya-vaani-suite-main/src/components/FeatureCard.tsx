import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  badge?: string;
}

const FeatureCard = ({ title, description, icon: Icon, path, badge }: FeatureCardProps) => {
  return (
    <Link to={path}>
      <Card className="h-full transition-all hover:shadow-medium hover:border-primary/50 cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg mt-3">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
};

export default FeatureCard;
