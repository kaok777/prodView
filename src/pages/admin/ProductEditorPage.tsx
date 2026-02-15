import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Upload, X, Save } from "lucide-react";
import { ProductImage } from "../../components/ProductImage";
import { FormInput } from "../../components/FormInput";
import { FormTextarea } from "../../components/FormTextarea";
import { FormSelect } from "../../components/FormSelect";
import { FormErrorList } from "../../components/FormError";
import api from "../../lib/api";
import { productSchema, ProductFormData } from "../../lib/validationSchemas";
import { getAllErrorMessages } from "../../lib/formValidation";
import type { Category, UseCase, ProductStatus } from "../../types";

/**
 * ProductEditorPage Component
 *
 * Admin page for creating and editing products with form validation
 * Fixed: HIGH-F6 - Form Validation Missing
 * Helps: MEDIUM-B3 - Missing Input Validation in Update Endpoints (client-side prevention)
 */

export function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Initialize react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      affiliateUrl: "",
      categoryIds: [],
      useCaseIds: [],
      images: [],
      status: "DRAFT" as ProductStatus,
    },
  });

  // Watch images array for UI updates
  const images = watch("images");
  const categoryIds = watch("categoryIds");
  const useCaseIds = watch("useCaseIds");

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
          const productRes = await api.get(`/products/admin/${id}`);
          const product = productRes.data;

          // Reset form with product data
          reset({
            name: product.name,
            description: product.description,
            affiliateUrl: product.affiliateUrl,
            categoryIds: product.categories?.map((c: { category?: { id: string }; id: string }) => c.category?.id || c.id) || [],
            useCaseIds: product.useCases?.map((u: { useCase?: { id: string }; id: string }) => u.useCase?.id || u.id) || [],
            images: product.images || [],
            status: product.status || "DRAFT",
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

  // Form submission with validation
  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditing && id) {
        await api.put(`/products/${id}`, data);
        toast.success("Product updated successfully");
      } else {
        await api.post('/products', data);
        toast.success("Product created successfully");
      }
      navigate("/admin");
    } catch (error: any) {
      console.error('Failed to save product:', error);
      toast.error(error.response?.data?.message || "Failed to save product");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await api.post('/upload/image', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data.path;
      });

      const uploadedPaths = await Promise.all(uploadPromises);

      // Update form value
      const currentImages = watch("images");
      setValue("images", [...currentImages, ...uploadedPaths], { shouldValidate: true });

      toast.success(`${uploadedPaths.length} image(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Failed to upload images:', error);
      toast.error(error.response?.data?.message || "Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const currentImages = watch("images");
    setValue("images", currentImages.filter((_, i) => i !== index), { shouldValidate: true });
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
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent hover:shadow-sm transition-all duration-200 ease-in-out"
          >
            Cancel
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Display validation errors */}
        {Object.keys(errors).length > 0 && (
          <FormErrorList errors={getAllErrorMessages(errors)} />
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <FormInput
              label="Product Name"
              required
              {...register("name")}
              error={errors.name?.message}
              placeholder="Enter product name"
            />

            <FormTextarea
              label="Description"
              required
              {...register("description")}
              error={errors.description?.message}
              placeholder="Enter product description"
              rows={6}
              maxLength={5000}
            />

            <FormInput
              label="Affiliate URL"
              type="url"
              required
              {...register("affiliateUrl")}
              error={errors.affiliateUrl?.message}
              placeholder="https://example.com/product"
            />

            <FormSelect
              label="Status"
              required
              {...register("status")}
              error={errors.status?.message}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </FormSelect>
          </div>

          {/* Categories & Use Cases */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Categories *
              </label>
              <div className={`space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2 ${
                errors.categoryIds ? "border-destructive" : "border-border"
              }`}>
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(category.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...categoryIds, category.id]
                          : categoryIds.filter(id => id !== category.id);
                        setValue("categoryIds", newIds, { shouldValidate: true });
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))}
              </div>
              {errors.categoryIds && (
                <p className="text-sm text-destructive mt-1">{errors.categoryIds.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Use Cases *
              </label>
              <div className={`space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2 ${
                errors.useCaseIds ? "border-destructive" : "border-border"
              }`}>
                {useCases.map((useCase) => (
                  <label key={useCase.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={useCaseIds.includes(useCase.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...useCaseIds, useCase.id]
                          : useCaseIds.filter(id => id !== useCase.id);
                        setValue("useCaseIds", newIds, { shouldValidate: true });
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{useCase.name}</span>
                  </label>
                ))}
              </div>
              {errors.useCaseIds && (
                <p className="text-sm text-destructive mt-1">{errors.useCaseIds.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Media Upload Section */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Product Images *
          </label>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-accent hover:shadow-sm transition-all duration-200 ease-in-out ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              } ${errors.images ? 'border-destructive' : 'border-border'}`}>
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Images"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-muted-foreground">
                {images.length} / 10 uploaded
              </span>
            </div>
            {errors.images && (
              <p className="text-sm text-destructive">{errors.images.message}</p>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((imagePath, index) => (
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
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out hover:scale-110"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                      {index + 1}
                    </div>
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
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 hover:shadow-md transition-all duration-200 ease-in-out flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
