import { useState, useEffect } from "react";
import { BarChart3, Eye, MousePointer, Search, TrendingUp } from "lucide-react";
import api from "../../lib/api";
import type { ProductWithAnalytics, CategoryWithAnalytics, SearchQueryStat } from "../../types";

export function AdminAnalytics() {
  const [topProducts, setTopProducts] = useState<ProductWithAnalytics[]>([]);
  const [affiliateClicks, setAffiliateClicks] = useState<ProductWithAnalytics[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryWithAnalytics[]>([]);
  const [searchStats, setSearchStats] = useState<SearchQueryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [topProductsRes, affiliateClicksRes, categoryStatsRes, searchStatsRes] = await Promise.all([
          api.get('/analytics/top-products', { params: { limit: 10 } }),
          api.get('/analytics/affiliate-clicks', { params: { limit: 10 } }),
          api.get('/analytics/category-stats'),
          api.get('/analytics/search-stats', { params: { limit: 15 } })
        ]);

        setTopProducts(topProductsRes.data);
        setAffiliateClicks(affiliateClicksRes.data);
        setCategoryStats(categoryStatsRes.data);
        setSearchStats(searchStatsRes.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-6">
              <div className="h-6 bg-muted rounded w-48 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed Products */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Most Viewed Products</h2>
          </div>
          <div className="space-y-3">
            {topProducts && topProducts.length > 0 ? topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium line-clamp-1">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.views} views</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available yet
              </div>
            )}
          </div>
        </div>

        {/* Top Affiliate Clicks */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <MousePointer className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold">Most Clicked Products</h2>
          </div>
          <div className="space-y-3">
            {affiliateClicks && affiliateClicks.length > 0 ? affiliateClicks.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium line-clamp-1">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.clicks} clicks</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available yet
              </div>
            )}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Category Performance</h2>
          </div>
          <div className="space-y-3">
            {categoryStats && categoryStats.length > 0 ? categoryStats.slice(0, 8).map((category, index) => (
              <div key={category.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.clicks} clicks</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available yet
              </div>
            )}
          </div>
        </div>

        {/* Search Queries */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold">Popular Searches</h2>
          </div>
          <div className="space-y-3">
            {searchStats && searchStats.length > 0 ? searchStats.map((search, index) => (
              <div key={search.query} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">"{search.query}"</p>
                    <p className="text-sm text-muted-foreground">{search.count} searches</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
