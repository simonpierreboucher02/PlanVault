import { Calendar, List, Bell, Download, Settings, LogOut, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";

interface CategoryStats {
  category: string;
  count: number;
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const { data: categoryStats = [] } = useQuery<CategoryStats[]>({
    queryKey: ['/api/stats/categories'],
  });

  const getCategoryCount = (category: string) => {
    const stat = categoryStats.find(s => s.category === category);
    return stat ? stat.count : 0;
  };

  const navItems = [
    { path: "/", label: "Calendar", icon: Calendar, active: location === "/" },
    { path: "/agenda", label: "Agenda", icon: List, active: location === "/agenda" },
    { path: "/reminders", label: "Reminders", icon: Bell, active: location === "/reminders" },
    { path: "/import-export", label: "Import/Export", icon: Download, active: location === "/import-export" },
  ];

  const categoryItems = [
    { name: "Work", color: "bg-work", count: getCategoryCount("work") },
    { name: "Personal", color: "bg-personal", count: getCategoryCount("personal") },
    { name: "Health", color: "bg-health", count: getCategoryCount("health") },
    { name: "Finance", color: "bg-finance", count: getCategoryCount("finance") },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex-shrink-0">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-8" data-testid="sidebar-header">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
            <Calendar className="text-primary-foreground text-sm" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">PlanVault</h1>
            <p className="text-xs text-muted-foreground">by MinimalAuth</p>
          </div>
        </div>
        
        {/* User Info */}
        <div className="bg-muted rounded-lg p-3 mb-6" data-testid="user-info">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-foreground text-sm font-medium">
                {user?.username.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium" data-testid="text-username">
                {user?.username}
              </p>
              <p className="text-xs text-muted-foreground">Logged in securely</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2" data-testid="navigation">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant={item.active ? "default" : "ghost"}
                className="w-full justify-start"
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Categories */}
        <div className="mt-8" data-testid="categories">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Categories
          </h3>
          <div className="space-y-2">
            {categoryItems.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${category.color}`} />
                  <span className="text-sm">{category.name}</span>
                </div>
                <span className="text-xs text-muted-foreground" data-testid={`count-${category.name.toLowerCase()}`}>
                  {category.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="mt-auto pt-8">
          <Button 
            variant="ghost" 
            className="w-full justify-start mb-2"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? "🌙" : "☀️"}
            <span className="ml-2">
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </span>
          </Button>
          <Button variant="ghost" className="w-full justify-start mb-2" data-testid="button-settings">
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
