import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import api from "../../lib/api";

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
  const [formData, setFormData] = useState({
    name: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUseCase) {
        await api.put(`/use-cases/${editingUseCase.id}`, {
          name: formData.name,
        });
        toast.success("Use case updated successfully");
      } else {
        await api.post("/use-cases", {
          name: formData.name,
        });
        toast.success("Use case created successfully");
      }
      setShowModal(false);
      setEditingUseCase(null);
      setFormData({ name: "" });
      fetchUseCases();
    } catch (error: any) {
      console.error("Failed to save use case:", error);
      toast.error(error.response?.data?.message || "Failed to save use case");
    }
  };

  const handleEdit = (useCase: UseCase) => {
    setEditingUseCase(useCase);
    setFormData({
      name: useCase.name,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

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
    setFormData({ name: "" });
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Use Case Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out placeholder:text-muted-foreground"
                  placeholder="Enter use case name"
                />
              </div>

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
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 hover:shadow-md transition-all duration-150 ease-out"
                >
                  {editingUseCase ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
