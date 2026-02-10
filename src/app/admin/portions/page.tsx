"use client";

import { useState, useEffect } from "react";
import AddPortionModal from "@/components/AddPortionModal";
import EditPortionModal from "@/components/EditPortionModal";
import { showErrorAlert, showConfirmDialog } from "@/lib/sweetalert";
import { FaEdit, FaTrash } from "react-icons/fa";

interface Portion {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PortionsPage() {
  const [portions, setPortions] = useState<Portion[]>([]);
  const [filteredPortions, setFilteredPortions] = useState<Portion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPortion, setSelectedPortion] = useState<Portion | null>(null);

  const fetchPortions = async () => {
    try {
      const response = await fetch('/api/admin/portions');
      if (!response.ok) {
        throw new Error('Failed to fetch portions');
      }
      const data = await response.json();
      setPortions(data);
      setFilteredPortions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortions();
  }, []);

  // Filter portions based on search term
  useEffect(() => {
    const filtered = portions.filter(portion =>
      portion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (portion.description && portion.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredPortions(filtered);
  }, [searchTerm, portions]);

  const handlePortionAdded = () => {
    fetchPortions();
  };

  const handleEditPortion = (portion: Portion) => {
    setSelectedPortion(portion);
    setIsEditModalOpen(true);
  };

  const handlePortionUpdated = () => {
    fetchPortions();
    setIsEditModalOpen(false);
    setSelectedPortion(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedPortion(null);
  };


  const handleDeletePortion = async (portionId: string) => {
    const portion = portions.find(p => p.id === portionId);
    if (!portion) return;

    const result = await showConfirmDialog(
      'Delete Portion',
      `Are you sure you want to delete the portion "${portion.name}"? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );
    
    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/portions/${portionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Show detailed error message for constraint violations
        if (errorData.affectedItems) {
          showErrorAlert(
            `Cannot delete portion "${portion.name}"`,
            `Affected food items: ${errorData.affectedItems.join(', ')}\n\n${errorData.error}`
          );
        } else {
          showErrorAlert('Error', errorData.error || 'Failed to delete portion');
        }
        
        throw new Error(errorData.error || 'Failed to delete portion');
      }

      // Remove from local state
      setPortions(prevPortions =>
        prevPortions.filter(port => port.id !== portionId)
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Portions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portions</h1>
            <p className="text-sm text-gray-500 mt-1">Add, edit, and manage your portion sizes for food items</p>
          </div>
        </div>
      </div>

      {/* Search Bar and Add Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search portions by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchPortions}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors flex items-center justify-center"
                title="Add Portion"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {filteredPortions.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm ? (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No portions found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms.</p>
                  </>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No portions</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new portion size.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Portion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPortions.map((portion) => (
                      <tr key={portion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {portion.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-medium text-gray-900">{portion.name}</div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  portion.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {portion.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {portion.description || "No description"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditPortion(portion)}
                              className="inline-flex items-center justify-center p-2 text-purple-600 hover:text-purple-900 rounded-md hover:bg-purple-50 transition-colors"
                              title="Edit"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePortion(portion.id)}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-900 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddPortionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPortionAdded={handlePortionAdded}
      />

      <EditPortionModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onPortionUpdated={handlePortionUpdated}
        portion={selectedPortion}
      />
    </div>
  );
} 