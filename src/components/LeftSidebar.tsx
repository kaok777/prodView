import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "../lib/api";

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<"categories" | "useCases">("categories");
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [useCases, setUseCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedCategory = searchParams.get("category");
  const selectedUseCase = searchParams.get("useCase");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, useCasesRes] = await Promise.all([
          api.get('/categories'),
          api.get('/use-cases'),
        ]);
        setCategories(categoriesRes.data);
        setUseCases(useCasesRes.data);
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <aside className={`relative bg-card border-r min-h-[calc(100vh-4rem)] transition-all duration-300 ${isCollapsed ? 'w-0' : 'w-64'}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 z-50 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`p-4 space-y-4 ${isCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'} transition-opacity duration-300`}>
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex-1 py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "categories"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab("useCases")}
            className={`flex-1 py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "useCases"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Use Cases
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === "categories" && (
              <div className="space-y-1">
                <Link
                  to="/products"
                  className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                    !selectedCategory && !selectedUseCase
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  All Categories
                </Link>
                {categories?.map((category) => (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.id}`}
                    className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}

            {activeTab === "useCases" && (
              <div className="space-y-1">
                <Link
                  to="/products"
                  className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                    !selectedUseCase && !selectedCategory
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  All Use Cases
                </Link>
                {useCases?.map((useCase) => (
                  <Link
                    key={useCase.id}
                    to={`/products?useCase=${useCase.id}`}
                    className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedUseCase === useCase.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {useCase.name}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
