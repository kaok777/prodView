import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { Search, Moon, Sun, Menu, LogOut } from "lucide-react";
import { getAdminSession, clearAdminSession } from "../utils/security";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const session = getAdminSession();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b h-16 flex items-center px-4">
      <div className="flex items-center gap-4 flex-1">
        <Link to="/" className="text-2xl font-bold text-primary">
          ProdView
        </Link>
        
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-accent"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        
        {session && isAdminRoute ? (
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        ) : (
          <Link
            to="/admin"
            className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Admin
          </Link>
        )}
      </div>
    </nav>
  );
}
