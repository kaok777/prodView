import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BarChart3, Eye, MousePointer, Search, TrendingUp } from "lucide-react";
import { getAdminSession } from "../../utils/security";

export function AdminAnalytics() {
  const session = getAdminSession();
  
  const topProducts = useQuery(
    api.analytics.getTopProducts, 
    session ? { adminId: session.adminId as any, limit: 10 } : "skip"
  );
  const affiliateClicks = useQuery(
    api.analytics.getAffiliateClicks, 
    session ? { adminId: session.adminId as any, limit: 10 } : "skip"
  );
  const categoryStats = useQuery(
    api.analytics.getCategoryStats,
    session ? { adminId: session.adminId as any } : "skip"
  );
  const searchStats = useQuery(
    api.analytics.getSearchStats, 
    session ? { adminId: session.adminId as any, limit: 15 } : "skip"
  );

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
            {topProducts && topProducts.length > 0 ? topProducts.filter(p => p !== null).map((product, index) => (
              <div key={product!._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium line-clamp-1">{(product as any).name}</p>
                    <p className="text-sm text-muted-foreground">{(product as any).views} views</p>
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
            {affiliateClicks && affiliateClicks.length > 0 ? affiliateClicks.filter(p => p !== null).map((product, index) => (
              <div key={product!._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium line-clamp-1">{(product as any).name}</p>
                    <p className="text-sm text-muted-foreground">{(product as any).clicks} clicks</p>
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
              <div key={category._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{(category as any).name}</p>
                    <p className="text-sm text-muted-foreground">{(category as any).clicks} clicks</p>
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
