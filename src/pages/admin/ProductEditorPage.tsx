import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Upload, X, Save, Eye } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { ProductImage } from "../../components/ProductImage";
import { getAdminSession } from "../../utils/security";

export function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const session = getAdminSession();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    affiliateUrl: "",
    categories: [] as Id<"categories">[],
    useCases: [] as Id<"useCases">[],
    images: [] as Id<"_storage">[]
  });

  const product = useQuery(
    api.products.getProductById,
    isEditing ? { productId: id as Id<"products"> } : "skip"
  );
  
  const categories = useQuery(api.categories.getAllCategories);
  const useCases = useQuery(api.useCases.getAllUseCases);
  
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);

  useEffect(() => {
    if (product && isEditing) {
      setFormData({
        name: product.name,
        description: product.description,
        affiliateUrl: product.affiliateUrl,
        categories: product.categories,
        useCases: product.useCases,
        images: product.images
      });
    }
  }, [product, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      toast.error("Not authenticated");
      return;
    }
    
    try {
      if (isEditing) {
        await updateProduct({
          adminId: session.adminId as any,
          productId: id as Id<"products">,
          ...formData
        });
        toast.success("Product updated successfully");
      } else {
        await createProduct({
          adminId: session.adminId as any,
          ...formData
        });
        toast.success("Product created successfully");
      }
      navigate("/admin");
    } catch (error) {
      toast.error("Failed to save product");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!session) {
      toast.error("Not authenticated");
      return;
    }

    try {
      const uploadUrl = await generateUploadUrl({
        adminId: session.adminId as any
      });
      
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, storageId]
      }));
      
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

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
          </div>

          {/* Categories & Use Cases */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Categories
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                {categories?.map((category) => (
                  <label key={category._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(category._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            categories: [...prev.categories, category._id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            categories: prev.categories.filter(id => id !== category._id)
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
                {useCases?.map((useCase) => (
                  <label key={useCase._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.useCases.includes(useCase._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            useCases: [...prev.useCases, useCase._id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            useCases: prev.useCases.filter(id => id !== useCase._id)
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
              <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                <Upload className="w-4 h-4" />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((imageId, index) => (
                  <div key={imageId} className="relative group">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <ProductImage
                        storageId={imageId}
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
