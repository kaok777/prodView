import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { useSidebarVisibility } from "../hooks/useSidebarVisibility";
import { SidebarToggle } from "./SidebarToggle";
import { ErrorService } from "../services/ErrorService";
import type { Category, UseCase } from "../types";

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<"categories" | "useCases">("categories");
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);

  const { isCollapsed, setIsCollapsed, isFirstVisit } = useSidebarVisibility({
    breakpoint: 1024,
    storageKey: "left-sidebar-visited",
  });

  const selectedCategory = searchParams.get("category");
  const selectedUseCase = searchParams.get("useCase");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Use Promise.allSettled to handle failures independently
        const results = await Promise.allSettled([
          api.get('/categories'),
          api.get('/use-cases'),
        ]);

        // Handle categories result
        if (results[0].status === 'fulfilled') {
          setCategories(results[0].value.data);
        } else {
          console.error('Failed to fetch categories:', results[0].reason);
          ErrorService.handleApiError(
            results[0].reason,
            {
              componentName: 'LeftSidebar',
              action: 'fetch_categories',
            },
            'Failed to load categories. Please refresh the page.'
          );
          setCategories([]);
        }

        // Handle use cases result
        if (results[1].status === 'fulfilled') {
          setUseCases(results[1].value.data);
        } else {
          console.error('Failed to fetch use cases:', results[1].reason);
          ErrorService.handleApiError(
            results[1].reason,
            {
              componentName: 'LeftSidebar',
              action: 'fetch_use_cases',
            },
            'Failed to load use cases. Please refresh the page.'
          );
          setUseCases([]);
        }
      } catch (error) {
        console.error('Unexpected error in LeftSidebar:', error);
        ErrorService.handleApiError(
          error,
          {
            componentName: 'LeftSidebar',
            action: 'fetch_data',
          },
          'Failed to load sidebar data. Please refresh the page.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {/* Overlay for mobile drawer */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 lg:z-40 bg-card border-r h-[calc(100vh-4rem)] transition-transform duration-300 ease-in-out ${
          isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-0' : 'translate-x-0 w-64 lg:w-64'
        }`}
        aria-label="Product filters sidebar"
      >
        <SidebarToggle
          isCollapsed={isCollapsed}
          onClick={() => setIsCollapsed(!isCollapsed)}
          position="left"
          label={isCollapsed ? "Expand filters" : "Collapse filters"}
          showFirstVisitPulse={isFirstVisit && isCollapsed}
        />

        <div
          className={`h-full overflow-y-auto custom-scrollbar p-4 space-y-4 ${
            isCollapsed ? 'opacity-0 invisible lg:opacity-0 lg:invisible' : 'opacity-100 visible'
          } transition-opacity duration-300`}
        >
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
                    onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
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
                      onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
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
                    onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
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
                      onClick={() => window.innerWidth < 1024 && setIsCollapsed(true)}
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
    </>
  );
}
