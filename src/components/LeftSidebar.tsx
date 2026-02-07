import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api";

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<"categories" | "useCases">("categories");
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [useCases, setUseCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <aside className="w-64 bg-card border-r min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-4">
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
                    !selectedCategory
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
                    !selectedUseCase
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
