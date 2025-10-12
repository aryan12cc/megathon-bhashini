import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const DATABASE_URL = import.meta.env.VITE_DATABASE_URL || "http://localhost:8002";

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            Please log in using your Google account to continue.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = `${DATABASE_URL}/api/auth/google`)}
          >
            {/* You can add a Google icon here */}
            Login with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
