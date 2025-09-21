import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Calendar, Key, TriangleAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [savedKeyConfirmed, setSavedKeyConfirmed] = useState(false);
  
  const { 
    login, 
    register, 
    generateRecoveryKey, 
    isLoginPending, 
    isRegisterPending, 
    loginError, 
    registerError,
    recoveryKey,
    isGeneratingKey 
  } = useAuth();
  
  const { toast } = useToast();

  const handleGenerateKey = () => {
    generateRecoveryKey();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (isLogin) {
      login({ username, password });
    } else {
      if (!recoveryKey) {
        toast({
          title: "Error",
          description: "Please generate a recovery key first",
          variant: "destructive",
        });
        return;
      }
      
      if (!savedKeyConfirmed) {
        toast({
          title: "Error",
          description: "Please confirm you have saved your recovery key",
          variant: "destructive",
        });
        return;
      }

      register({ username, password, recoveryKey });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto">
            <Calendar className="text-primary-foreground text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome to PlanVault</h1>
            <p className="text-muted-foreground">Privacy-first calendar & reminders</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div data-testid="input-username">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder={isLogin ? "Enter your username" : "Choose a username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoginPending || isRegisterPending}
              />
            </div>
            
            <div data-testid="input-password">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={isLogin ? "Enter your password" : "Create a secure password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoginPending || isRegisterPending}
              />
            </div>

            {loginError && (
              <div className="flex items-start text-destructive text-sm" data-testid="error-login">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                {loginError}
              </div>
            )}

            {registerError && (
              <div className="flex items-start text-destructive text-sm" data-testid="error-register">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                {registerError}
              </div>
            )}

            {!isLogin && (
              <>
                <div className="p-4 bg-muted rounded-lg border-2 border-dashed border-border">
                  <div className="flex items-start">
                    <Key className="text-secondary mr-3 mt-1 h-4 w-4" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-2">Your Recovery Key</h4>
                      {recoveryKey ? (
                        <code className="text-xs bg-background p-2 rounded block font-mono break-all" data-testid="text-recovery-key">
                          {recoveryKey}
                        </code>
                      ) : (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={handleGenerateKey}
                          disabled={isGeneratingKey}
                          data-testid="button-generate-key"
                        >
                          {isGeneratingKey ? "Generating..." : "Generate Recovery Key"}
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 flex items-start">
                        <TriangleAlert className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                        Save this key safely. It's required for account recovery.
                      </p>
                    </div>
                  </div>
                </div>

                {recoveryKey && (
                  <div className="flex items-center space-x-2" data-testid="checkbox-saved-key">
                    <Checkbox
                      id="savedKey"
                      checked={savedKeyConfirmed}
                      onCheckedChange={(checked) => setSavedKeyConfirmed(checked === true)}
                    />
                    <Label htmlFor="savedKey" className="text-sm">
                      I have saved my recovery key securely
                    </Label>
                  </div>
                )}
              </>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoginPending || isRegisterPending}
              data-testid="button-submit"
            >
              {isLoginPending || isRegisterPending 
                ? "Please wait..." 
                : isLogin 
                  ? "Sign In" 
                  : "Create Account"
              }
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setUsername("");
                  setPassword("");
                  setSavedKeyConfirmed(false);
                }}
                data-testid="button-toggle-mode"
              >
                {isLogin 
                  ? "Don't have an account? Sign Up" 
                  : "Already have an account? Sign In"
                }
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                No email required • No phone number • No tracking
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
