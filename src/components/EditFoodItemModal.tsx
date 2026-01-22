"use client";

import { useState, useEffect } from "react";
import { showSuccessAlert } from '@/lib/sweetalert';
import { UnitType, getAvailableUnits, convertToIngredientBaseUnit, areUnitsCompatible } from '@/lib/unitConversion';

interface EditFoodItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: FoodItem | null;
  onFoodItemUpdated: () => void;
}

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    description: string | null;
  };
  foodItemPortions: FoodItemPortion[];
}

interface FoodItemPortion {
  id: string;
  portionId: string;
  price: number;
  portion: {
    id: string;
    name: string;
    description: string | null;
  };
  ingredients: FoodItemPortionIngredient[];
}

interface FoodItemPortionIngredient {
  id: string;
  ingredientId: string;
  quantity: number;
  ingredient: {
    id: string;
    name: string;
    unitOfMeasurement: string;
  };
}

interface FoodItemFormData {
  name: string;
  description: string;
  categoryId: string;
}

interface PortionPrice {
  id?: string;
  portionId: string;
  price: string;
  ingredients: PortionIngredient[];
}

interface PortionIngredient {
  id?: string;
  ingredientId: string;
  quantity: string;
  selectedUnit: UnitType;
}

interface Portion {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface Ingredient {
  id: string;
  name: string;
  description: string | null;
  unitOfMeasurement: string;
  isActive: boolean;
}

export default function EditFoodItemModal({ isOpen, onClose, foodItem, onFoodItemUpdated }: EditFoodItemModalProps) {
  const [formData, setFormData] = useState<FoodItemFormData>({
    name: "",
    description: "",
    categoryId: "",
  });
  const [portionPrices, setPortionPrices] = useState<PortionPrice[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [portions, setPortions] = useState<Portion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showAddPortionModal, setShowAddPortionModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: "", unitOfMeasurement: "g", description: "" });
  const [newPortion, setNewPortion] = useState({ name: "", description: "" });
  const [isCreatingIngredient, setIsCreatingIngredient] = useState(false);
  const [isCreatingPortion, setIsCreatingPortion] = useState(false);

  // Initialize form data when foodItem changes
  useEffect(() => {
    if (foodItem && isOpen) {
      setFormData({
        name: foodItem.name,
        description: foodItem.description || "",
        categoryId: foodItem.categoryId,
      });
      
      // Convert existing portions to form format with ingredients
      const existingPortions = foodItem.foodItemPortions.map(fp => ({
        id: fp.id,
        portionId: fp.portionId,
        price: fp.price.toString(),
        ingredients: fp.ingredients.map(ing => ({
          id: ing.id,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity.toString(),
          selectedUnit: ing.ingredient.unitOfMeasurement as UnitType,
        }))
      }));
      setPortionPrices(existingPortions);
      
      // Set image preview
      setImagePreview(foodItem.imageUrl);
      
      // Fetch portions, categories, and ingredients
      fetchPortions();
      fetchCategories();
      fetchIngredients();
    }
  }, [foodItem, isOpen]);

  const fetchPortions = async () => {
    try {
      const response = await fetch('/api/admin/portions');
      if (!response.ok) {
        throw new Error('Failed to fetch portions');
      }
      const data = await response.json();
      setPortions(data.filter((portion: Portion) => portion.isActive));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data.filter((category: Category) => category.isActive));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/admin/ingredients');
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }
      const data = await response.json();
      setIngredients(data.filter((ingredient: Ingredient) => ingredient.isActive));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePortionPriceChange = (index: number, field: 'portionId' | 'price', value: string) => {
    const newPortionPrices = [...portionPrices];
    
    if (field === 'price') {
      // Validate and format price to only allow two decimal places
      const numericValue = value.replace(/[^0-9.]/g, '');
      
      // Check if there are more than one decimal points
      const decimalCount = (numericValue.match(/\./g) || []).length;
      if (decimalCount > 1) {
        return; // Don't update if multiple decimal points
      }
      
      // Check if there are more than 2 digits after decimal point
      const parts = numericValue.split('.');
      if (parts.length > 1 && parts[1].length > 2) {
        return; // Don't update if more than 2 decimal places
      }
      
      newPortionPrices[index] = { ...newPortionPrices[index], [field]: numericValue };
    } else {
      newPortionPrices[index] = { ...newPortionPrices[index], [field]: value };
    }
    
    setPortionPrices(newPortionPrices);
  };

  const addPortionPrice = () => {
    setPortionPrices([...portionPrices, { portionId: "", price: "", ingredients: [] }]);
  };

  const removePortionPrice = (index: number) => {
    const newPortionPrices = portionPrices.filter((_, i) => i !== index);
    setPortionPrices(newPortionPrices);
  };

  const addIngredientToPortion = (portionIndex: number) => {
    const newPortionPrices = [...portionPrices];
    newPortionPrices[portionIndex].ingredients.push({
      ingredientId: "",
      quantity: "",
      selectedUnit: "g" as UnitType
    });
    setPortionPrices(newPortionPrices);
  };

  const removeIngredientFromPortion = (portionIndex: number, ingredientIndex: number) => {
    const newPortionPrices = [...portionPrices];
    newPortionPrices[portionIndex].ingredients.splice(ingredientIndex, 1);
    setPortionPrices(newPortionPrices);
  };

  const handleIngredientChange = (
    portionIndex: number,
    ingredientIndex: number,
    field: 'ingredientId' | 'quantity' | 'selectedUnit',
    value: string
  ) => {
    const newPortionPrices = [...portionPrices];
    
    if (field === 'quantity') {
      // Validate quantity to only allow positive numbers with up to 2 decimal places
      const numericValue = value.replace(/[^0-9.]/g, '');
      
      // Check if there are more than one decimal points
      const decimalCount = (numericValue.match(/\./g) || []).length;
      if (decimalCount > 1) {
        return;
      }
      
      // Check if there are more than 2 digits after decimal point
      const parts = numericValue.split('.');
      if (parts.length > 1 && parts[1].length > 2) {
        return;
      }
      
      newPortionPrices[portionIndex].ingredients[ingredientIndex] = {
        ...newPortionPrices[portionIndex].ingredients[ingredientIndex],
        [field]: numericValue
      };
    } else if (field === 'ingredientId') {
      // When ingredient changes, set the default unit to the ingredient's base unit
      const selectedIngredient = ingredients.find(ing => ing.id === value);
      const defaultUnit = selectedIngredient ? selectedIngredient.unitOfMeasurement as UnitType : "g" as UnitType;
      
      newPortionPrices[portionIndex].ingredients[ingredientIndex] = {
        ...newPortionPrices[portionIndex].ingredients[ingredientIndex],
        [field]: value,
        selectedUnit: defaultUnit
      };
    } else if (field === 'selectedUnit') {
      newPortionPrices[portionIndex].ingredients[ingredientIndex] = {
        ...newPortionPrices[portionIndex].ingredients[ingredientIndex],
        selectedUnit: value as UnitType
      };
    }
    
    setPortionPrices(newPortionPrices);
  };

  const getAvailableIngredients = (portionIndex: number, ingredientIndex: number) => {
    const usedIngredientIds = portionPrices[portionIndex].ingredients
      .map((ing, index) => index !== ingredientIndex ? ing.ingredientId : null)
      .filter(Boolean);
    return ingredients.filter(ingredient => !usedIngredientIds.includes(ingredient.id));
  };

  const getIngredientUnit = (ingredientId: string) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    return ingredient ? ingredient.unitOfMeasurement : '';
  };

  const getAvailablePortions = (currentIndex: number) => {
    const usedPortionIds = portionPrices
      .map((pp, index) => index !== currentIndex ? pp.portionId : null)
      .filter(Boolean);
    return portions.filter(portion => !usedPortionIds.includes(portion.id));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.imageUrl;
  };

  const handleCreateIngredient = async () => {
    if (!newIngredient.name.trim() || !newIngredient.unitOfMeasurement) {
      setError('Ingredient name and unit of measurement are required');
      return;
    }

    setIsCreatingIngredient(true);
    try {
      const response = await fetch('/api/admin/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIngredient),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ingredient');
      }

      const createdIngredient = await response.json();
      setIngredients([...ingredients, createdIngredient]);
      setNewIngredient({ name: "", unitOfMeasurement: "g", description: "" });
      setShowAddIngredientModal(false);
      setError("");
      
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        title: 'Success!',
        text: 'Ingredient created successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreatingIngredient(false);
    }
  };

  const handleCreatePortion = async () => {
    if (!newPortion.name.trim()) {
      setError('Portion name is required');
      return;
    }

    setIsCreatingPortion(true);
    try {
      const response = await fetch('/api/admin/portions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPortion),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portion');
      }

      const createdPortion = await response.json();
      setPortions([...portions, createdPortion]);
      setNewPortion({ name: "", description: "" });
      setShowAddPortionModal(false);
      setError("");
      
      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        title: 'Success!',
        text: 'Portion created successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
      
      return createdPortion;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsCreatingPortion(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodItem) return;

    setIsLoading(true);
    setError("");

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Food item name is required');
      }
      if (!formData.categoryId) {
        throw new Error('Category is required');
      }
      if (portionPrices.length === 0) {
        throw new Error('At least one portion and price is required');
      }

      // Enhanced validation for portions, prices, and ingredients
      for (let i = 0; i < portionPrices.length; i++) {
        const portion = portionPrices[i];
        
        // Validate portion selection
        if (!portion.portionId) {
          throw new Error(`Portion ${i + 1}: Please select a portion`);
        }
        
        // Validate price
        if (!portion.price || portion.price.trim() === '') {
          throw new Error(`Portion ${i + 1}: Price is required`);
        }
        
        const priceValue = parseFloat(portion.price);
        if (isNaN(priceValue) || priceValue <= 0) {
          throw new Error(`Portion ${i + 1}: Please enter a valid price greater than 0`);
        }
        
        // Validate ingredients for this portion (ingredients are now optional)
        if (portion.ingredients && portion.ingredients.length > 0) {
          for (let j = 0; j < portion.ingredients.length; j++) {
            const ingredient = portion.ingredients[j];
            
            if (!ingredient.ingredientId) {
              throw new Error(`Portion ${i + 1}, Ingredient ${j + 1}: Please select an ingredient`);
            }
            
            if (!ingredient.quantity || ingredient.quantity.trim() === '') {
              throw new Error(`Portion ${i + 1}, Ingredient ${j + 1}: Quantity is required`);
            }
            
            const quantityValue = parseFloat(ingredient.quantity);
            if (isNaN(quantityValue) || quantityValue <= 0) {
              throw new Error(`Portion ${i + 1}, Ingredient ${j + 1}: Please enter a valid quantity greater than 0`);
            }
            
            if (!ingredient.selectedUnit) {
              throw new Error(`Portion ${i + 1}, Ingredient ${j + 1}: Please select a unit`);
            }
          }
        }
      }

      // Validate that we have at least one valid portion with price
      const validPortionPrices = portionPrices.filter(pp => pp.portionId && pp.price && parseFloat(pp.price) > 0);
      if (validPortionPrices.length === 0) {
        throw new Error('At least one valid portion with price is required');
      }

      // Upload image if selected
      let imageUrl = foodItem.imageUrl;
      if (selectedImage) {
        setIsUploadingImage(true);
        imageUrl = await uploadImage(selectedImage);
        setIsUploadingImage(false);
      }

      // Prepare data for API
      const updateData = {
        id: foodItem.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        categoryId: formData.categoryId,
        imageUrl,
        portions: validPortionPrices.map(pp => ({
          id: pp.id, // Include existing ID for updates
          portionId: pp.portionId,
          price: parseFloat(pp.price),
          ingredients: pp.ingredients.filter(ing => ing.ingredientId && ing.quantity).map(ing => {
            const selectedIngredient = ingredients.find(ingredient => ingredient.id === ing.ingredientId);
            const ingredientBaseUnit = selectedIngredient ? selectedIngredient.unitOfMeasurement as UnitType : "g" as UnitType;
            const quantityInIngredientBaseUnit = convertToIngredientBaseUnit(
              parseFloat(ing.quantity), 
              ing.selectedUnit, 
              ingredientBaseUnit
            );
            
            return {
              id: ing.id, // Include existing ID for updates
              ingredientId: ing.ingredientId,
              quantity: quantityInIngredientBaseUnit
            };
          })
        })),
      };

      const response = await fetch('/api/admin/food-items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update food item');
      }

      showSuccessAlert('Food item updated successfully!');
      onFoodItemUpdated();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      categoryId: "",
    });
    setPortionPrices([]);
    setSelectedImage(null);
    setImagePreview(null);
    setError("");
    onClose();
  };

  if (!isOpen || !foodItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit Food Item</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Food Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter food item name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter description (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Image</h3>
              <div className="space-y-4">
                {imagePreview && (
                  <div className="flex items-center space-x-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Portions, Prices, and Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Portions, Prices & Ingredients *</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPortionModal(true)}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    + Create New Portion
                  </button>
                  <button
                    type="button"
                    onClick={addPortionPrice}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Portion
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {portionPrices.map((portionPrice, portionIndex) => (
                  <div key={portionIndex} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Portion {portionIndex + 1}</h4>
                      {portionPrices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePortionPrice(portionIndex)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    {/* Portion and Price Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div>
                        <select
                          value={portionPrice.portionId}
                          onChange={(e) => handlePortionPriceChange(portionIndex, 'portionId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select or create portion</option>
                          {getAvailablePortions(portionIndex).map((portion) => (
                            <option key={portion.id} value={portion.id}>
                              {portion.name} {portion.description && `- ${portion.description}`}
                            </option>
                          ))}
                        </select>
                        <div className="mt-1 text-xs text-gray-500">
                          Don't see your portion? Click "Create New Portion" button above
                        </div>
                      </div>
                      
                      <div>
                        <input
                          type="number"
                          value={portionPrice.price}
                          onChange={(e) => handlePortionPriceChange(portionIndex, 'price', e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="Price (Rs.)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    {/* Ingredients Section */}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-600">Ingredients (Optional)</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddIngredientModal(true)}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md hover:bg-purple-200 transition-colors"
                          >
                            + Create New Ingredient
                          </button>
                          <button
                            type="button"
                            onClick={() => addIngredientToPortion(portionIndex)}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md hover:bg-green-200 transition-colors"
                          >
                            + Add Ingredient
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {portionPrice.ingredients.map((ingredient, ingredientIndex) => {
                          const selectedIngredient = ingredients.find(ing => ing.id === ingredient.ingredientId);
                          const availableUnits = selectedIngredient ? getAvailableUnits(selectedIngredient.unitOfMeasurement as UnitType) : [];
                          
                          return (
                            <div key={ingredientIndex} className="flex items-center space-x-2 p-2 bg-white rounded border">
                              <div className="flex-1">
                                <select
                                  value={ingredient.ingredientId}
                                  onChange={(e) => handleIngredientChange(portionIndex, ingredientIndex, 'ingredientId', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">Select ingredient</option>
                                  {getAvailableIngredients(portionIndex, ingredientIndex).map((ing) => (
                                    <option key={ing.id} value={ing.id}>
                                      {ing.name} ({ing.unitOfMeasurement})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="flex-1">
                                <input
                                  type="number"
                                  value={ingredient.quantity}
                                  onChange={(e) => handleIngredientChange(portionIndex, ingredientIndex, 'quantity', e.target.value)}
                                  min="0"
                                  step="0.01"
                                  placeholder="Quantity"
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              
                              <div className="w-20">
                                <select
                                  value={ingredient.selectedUnit}
                                  onChange={(e) => handleIngredientChange(portionIndex, ingredientIndex, 'selectedUnit', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  disabled={!selectedIngredient}
                                >
                                  {availableUnits.map((unit) => (
                                    <option key={unit} value={unit}>
                                      {unit}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => removeIngredientFromPortion(portionIndex, ingredientIndex)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploadingImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Food Item'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {showAddIngredientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Create New Ingredient</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Tomatoes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit of Measurement <span className="text-red-500">*</span>
                </label>
                <select
                  value={newIngredient.unitOfMeasurement}
                  onChange={(e) => setNewIngredient({ ...newIngredient, unitOfMeasurement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="l">Liters (l)</option>
                  <option value="pieces">Pieces</option>
                  <option value="cups">Cups</option>
                  <option value="tbsp">Tablespoons</option>
                  <option value="tsp">Teaspoons</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newIngredient.description}
                  onChange={(e) => setNewIngredient({ ...newIngredient, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddIngredientModal(false);
                  setNewIngredient({ name: "", unitOfMeasurement: "g", description: "" });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateIngredient}
                disabled={isCreatingIngredient}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isCreatingIngredient ? 'Creating...' : 'Create Ingredient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Portion Modal */}
      {showAddPortionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Create New Portion</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Portion Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPortion.name}
                  onChange={(e) => setNewPortion({ ...newPortion, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Family Size, Small, Large"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newPortion.description}
                  onChange={(e) => setNewPortion({ ...newPortion, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddPortionModal(false);
                  setNewPortion({ name: "", description: "" });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePortion}
                disabled={isCreatingPortion}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isCreatingPortion ? 'Creating...' : 'Create Portion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 

