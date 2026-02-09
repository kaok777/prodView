import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, BarChart3, Folder, Tag } from "lucide-react";
import { ProductImage } from "../../components/ProductImage";
import api from "../../lib/api";

export function AdminDashboard() {
  const [statusFilter, setStatusFilter] = useState<"all" | "DRAFT" | "PUBLISHED" | "ARCHIVED">("all");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products/admin/all', {
          params: { limit: 100 }
        });
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.delete(`/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const filteredProducts = products.filter(product =>
    statusFilter === "all" || product.status === statusFilter
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-4">
              <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/admin/categories"
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent hover:shadow-sm transition-all duration-150 ease-out flex items-center gap-2"
          >
            <Folder className="w-4 h-4" />
            Categories
          </Link>
          <Link
            to="/admin/use-cases"
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent hover:shadow-sm transition-all duration-150 ease-out flex items-center gap-2"
          >
            <Tag className="w-4 h-4" />
            Use Cases
          </Link>
          <Link
            to="/admin/analytics"
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent hover:shadow-sm transition-all duration-150 ease-out flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
          <Link
            to="/admin/products/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 hover:shadow-md transition-all duration-150 ease-out flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4 hover:shadow-md transition-all duration-200 ease-in-out">
          <h3 className="text-sm font-medium text-muted-foreground">Total Products</h3>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="bg-card rounded-lg border p-4 hover:shadow-md transition-all duration-200 ease-in-out">
          <h3 className="text-sm font-medium text-muted-foreground">Published</h3>
          <p className="text-2xl font-bold">
            {products.filter(p => p.status === "PUBLISHED").length}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4 hover:shadow-md transition-all duration-200 ease-in-out">
          <h3 className="text-sm font-medium text-muted-foreground">Drafts</h3>
          <p className="text-2xl font-bold">
            {products.filter(p => p.status === "DRAFT").length}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4 hover:shadow-md transition-all duration-200 ease-in-out">
          <h3 className="text-sm font-medium text-muted-foreground">Archived</h3>
          <p className="text-2xl font-bold">
            {products.filter(p => p.status === "ARCHIVED").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-lg text-sm capitalize transition-all duration-150 ease-out ${
              statusFilter === status
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-accent hover:bg-accent/80 hover:shadow-sm"
            }`}
          >
            {status === "all" ? "all" : status.toLowerCase()}
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
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t hover:bg-accent/50 transition-colors duration-150">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {product.images && product.images[0] && (
                            <ProductImage
                              imagePath={product.images[0]}
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        product.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : product.status === "DRAFT"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      }`}>
                        {product.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/products/${product.id}`}
                          className="p-1 hover:bg-accent rounded transition-all duration-150 ease-out hover:scale-110"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="p-1 hover:bg-accent rounded transition-all duration-150 ease-out hover:scale-110"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1 hover:bg-accent rounded text-destructive transition-all duration-150 ease-out hover:scale-110"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
