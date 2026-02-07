import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, ChevronDown } from "lucide-react";

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<"categories" | "useCases">("categories");
  const [searchParams] = useSearchParams();
  
  const categories = useQuery(api.categories.getAllCategories);
  const useCases = useQuery(api.useCases.getAllUseCases);

  const selectedCategory = searchParams.get("category");
  const selectedUseCase = searchParams.get("useCase");

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
                key={category._id}
                to={`/products?category=${category._id}`}
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedCategory === category._id
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
                key={useCase._id}
                to={`/products?useCase=${useCase._id}`}
                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedUseCase === useCase._id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {useCase.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
