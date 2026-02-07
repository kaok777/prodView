import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload, X, Save } from "lucide-react";
import { ProductImage } from "../../components/ProductImage";
import api from "../../lib/api";

export function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    affiliateUrl: "",
    categoryIds: [] as string[],
    useCaseIds: [] as string[],
    images: [] as string[],
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED"
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [useCases, setUseCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, useCasesRes] = await Promise.all([
          api.get('/categories'),
          api.get('/use-cases')
        ]);

        setCategories(categoriesRes.data);
        setUseCases(useCasesRes.data);

        if (isEditing && id) {
          const productRes = await api.get(`/products/${id}`);
          const product = productRes.data;

          setFormData({
            name: product.name,
            description: product.description,
            affiliateUrl: product.affiliateUrl,
            categoryIds: product.categories?.map((c: any) => c.category?.id || c.id) || [],
            useCaseIds: product.useCases?.map((u: any) => u.useCase?.id || u.id) || [],
            images: product.images || [],
            status: product.status || "DRAFT"
          });
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && id) {
        await api.put(`/products/${id}`, formData);
        toast.success("Product updated successfully");
      } else {
        await api.post('/products', formData);
        toast.success("Product created successfully");
      }
      navigate("/admin");
    } catch (error: any) {
      console.error('Failed to save product:', error);
      toast.error(error.response?.data?.message || "Failed to save product");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, response.data.path]
      }));

      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      toast.error(error.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-10 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-32 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Product" : "Create Product"}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter product description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Affiliate URL *
              </label>
              <input
                type="url"
                value={formData.affiliateUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, affiliateUrl: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/product"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Categories & Use Cases */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Categories
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            categoryIds: [...prev.categoryIds, category.id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            categoryIds: prev.categoryIds.filter(id => id !== category.id)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Use Cases
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                {useCases.map((useCase) => (
                  <label key={useCase.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.useCaseIds.includes(useCase.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            useCaseIds: [...prev.useCaseIds, useCase.id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            useCaseIds: prev.useCaseIds.filter(id => id !== useCase.id)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{useCase.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Product Images
          </label>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className={`flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((imagePath, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <ProductImage
                        imagePath={imagePath}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Update Product" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
