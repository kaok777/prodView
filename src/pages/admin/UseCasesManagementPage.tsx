import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { ConfirmDialog, useConfirmDialog } from "../../components/ConfirmDialog";
import { FormInput } from "../../components/FormInput";
import api from "../../lib/api";
import { useCaseSchema, UseCaseFormData } from "../../lib/validationSchemas";

/**
 * UseCasesManagementPage Component
 *
 * Admin page for managing use cases with form validation and ConfirmDialog
 * Fixed: HIGH-F6 - Form Validation Missing
 * Fixed: HIGH-F5 - Browser confirm() Dialogs (uses ConfirmDialog from Master Prompt 7)
 * Helps: MEDIUM-B3 - Missing Input Validation in Update Endpoints (client-side prevention)
 */

interface UseCase {
  id: string;
  name: string;
  createdAt: string;
}

export function UseCasesManagementPage() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);

  // Initialize react-hook-form with zod validation
  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UseCaseFormData>({
    resolver: zodResolver(useCaseSchema),
    defaultValues: {
      name: "",
    },
  });

  // ConfirmDialog for delete confirmation
  const confirmDialog = useConfirmDialog();

  useEffect(() => {
    fetchUseCases();
  }, []);

  const fetchUseCases = async () => {
    try {
      setLoading(true);
      const response = await api.get("/use-cases");
      setUseCases(response.data);
    } catch (error) {
      console.error("Failed to fetch use cases:", error);
      toast.error("Failed to load use cases");
    } finally {
      setLoading(false);
    }
  };

  // Form submission with validation
  const onSubmit = async (data: UseCaseFormData) => {
    try {
      if (editingUseCase) {
        await api.put(`/use-cases/${editingUseCase.id}`, {
          name: data.name,
        });
        toast.success("Use case updated successfully");
      } else {
        await api.post("/use-cases", {
          name: data.name,
        });
        toast.success("Use case created successfully");
      }
      setShowModal(false);
      setEditingUseCase(null);
      reset();
      fetchUseCases();
    } catch (error: any) {
      console.error("Failed to save use case:", error);
      toast.error(error.response?.data?.message || "Failed to save use case");
    }
  };

  const handleEdit = (useCase: UseCase) => {
    setEditingUseCase(useCase);
    reset({
      name: useCase.name,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDialog.open();
    if (!confirmed) return;

    try {
      await api.delete(`/use-cases/${id}`);
      toast.success("Use case deleted successfully");
      fetchUseCases();
    } catch (error: any) {
      console.error("Failed to delete use case:", error);
      toast.error(error.response?.data?.message || "Failed to delete use case");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUseCase(null);
    reset();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Use Cases Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 hover:shadow-md transition-all duration-150 ease-out flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Use Case
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium">Name</th>
              <th className="text-right px-6 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {useCases.map((useCase) => (
              <tr key={useCase.id} className="hover:bg-muted/30 transition-colors duration-150">
                <td className="px-6 py-4">{useCase.name}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(useCase)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all duration-150 ease-out hover:scale-110"
                      aria-label={`Edit ${useCase.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(useCase.id, useCase.name)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-150 ease-out hover:scale-110"
                      aria-label={`Delete ${useCase.name}`}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-lg w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingUseCase ? "Edit Use Case" : "Add Use Case"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-muted rounded transition-all duration-150 ease-out hover:scale-110"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
              <FormInput
                label="Use Case Name"
                required
                {...register("name")}
                error={errors.name?.message}
                placeholder="Enter use case name"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted hover:shadow-sm transition-all duration-150 ease-out"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 hover:shadow-md transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : editingUseCase ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Use Case"
        message="Are you sure you want to delete this use case? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDialog.confirm}
        onCancel={confirmDialog.close}
      />
    </div>
  );
}

export default UseCasesManagementPage;
