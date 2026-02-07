import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, BarChart3 } from "lucide-react";
import { ProductImage } from "../../components/ProductImage";
import { getAdminSession } from "../../utils/security";

export function AdminDashboard() {
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  
  const session = getAdminSession();
  const products = useQuery(
    api.products.getAllProductsForAdmin, 
    session ? { adminId: session.adminId as any, limit: 100 } : "skip"
  );

  const filteredProducts = products?.filter(product => 
    statusFilter === "all" || product.status === statusFilter
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link
            to="/admin/analytics"
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
          <Link
            to="/admin/products/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Products</h3>
          <p className="text-2xl font-bold">{products?.length || 0}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Published</h3>
          <p className="text-2xl font-bold">
            {products?.filter(p => p.status === "published").length || 0}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Drafts</h3>
          <p className="text-2xl font-bold">
            {products?.filter(p => p.status === "draft").length || 0}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Archived</h3>
          <p className="text-2xl font-bold">
            {products?.filter(p => p.status === "archived").length || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "draft", "published", "archived"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as any)}
            className={`px-3 py-1 rounded-lg text-sm capitalize ${
              statusFilter === status
                ? "bg-primary text-primary-foreground"
                : "bg-accent hover:bg-accent/80"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Product</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Created</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id} className="border-t">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {product.images[0] && (
                          <ProductImage
                            storageId={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.status === "published" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : product.status === "draft"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/products/${product._id}`}
                        className="p-1 hover:bg-accent rounded"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/admin/products/${product._id}/edit`}
                        className="p-1 hover:bg-accent rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-1 hover:bg-accent rounded text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
