import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, MobileHeader } from "@/components/app-sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title = "PlanVault" }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <MobileHeader title={title} />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}