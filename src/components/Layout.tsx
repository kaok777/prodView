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
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)] p-6">
          {children}
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}
