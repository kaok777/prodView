import { Navbar } from "./Navbar";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex relative">
        <LeftSidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}
