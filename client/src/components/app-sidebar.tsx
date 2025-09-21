import { Calendar, List, Bell, Download, Settings, LogOut, Menu, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface CategoryStats {
  category: string;
  count: number;
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

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
    { name: "Work", color: "bg-orange-500", count: getCategoryCount("work") },
    { name: "Personal", color: "bg-green-500", count: getCategoryCount("personal") },
    { name: "Health", color: "bg-blue-500", count: getCategoryCount("health") },
    { name: "Finance", color: "bg-yellow-500", count: getCategoryCount("finance") },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="text-primary-foreground h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">PlanVault</h1>
              <p className="text-xs text-muted-foreground">by MinimalAuth</p>
            </div>
          </div>
        </div>
        
        {/* User Info - Mobile Compact */}
        <div className="bg-sidebar-accent rounded-lg p-3 mt-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground text-sm font-medium">
                {user?.username.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" data-testid="text-username">
                {user?.username}
              </p>
              <p className="text-xs text-muted-foreground">Logged in securely</p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-4">
        {/* Navigation */}
        <SidebarMenu data-testid="navigation">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={item.active}
                className="w-full justify-start"
              >
                <Link 
                  href={item.path} 
                  data-testid={`nav-${item.label.toLowerCase().replace('/', '-')}`}
                  onClick={() => {
                    // Auto-close mobile sidebar on navigation
                    if (window.innerWidth < 768) {
                      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                    }
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* Categories */}
        <div className="mt-8" data-testid="categories">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-2">
            Categories
          </h3>
          <div className="space-y-2">
            {categoryItems.map((category) => (
              <div key={category.name} className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  <span className="text-sm">{category.name}</span>
                </div>
                <span className="text-xs text-muted-foreground" data-testid={`count-${category.name.toLowerCase()}`}>
                  {category.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          data-testid="button-theme-toggle"
        >
          {theme === "light" ? "🌙" : "☀️"}
          <span className="ml-2">
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </span>
        </Button>
        <Button variant="ghost" className="w-full justify-start" data-testid="button-settings">
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
      </SidebarFooter>
    </Sidebar>
  );
}

// Mobile Header Component
export function MobileHeader({ title }: { title: string }) {
  return (
    <header className="md:hidden bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <SidebarTrigger className="h-8 w-8" />
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </header>
  );
}