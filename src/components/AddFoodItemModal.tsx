"use client";

import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { showSuccessAlert } from '@/lib/sweetalert';
import { UnitType, getAvailableUnits, convertToIngredientBaseUnit } from '@/lib/unitConversion';

interface AddFoodItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodItemAdded: () => void;
}

interface FoodItemFormData {
  name: string;
  description: string;
  categoryId: string;
}

interface PortionPrice {
  portionId: string;
  price: string;
  ingredients: PortionIngredient[];
}

interface PortionIngredient {
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

interface FormValues {
  name: string;
  description: string;
  categoryId: string;
  portionPrices: PortionPrice[];
}

export default function AddFoodItemModal({ isOpen, onClose, onFoodItemAdded }: AddFoodItemModalProps) {
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
  const [portionSearchTerms, setPortionSearchTerms] = useState<string[]>([]);

  // Fetch portions, categories, and ingredients when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPortions();
      fetchCategories();
      fetchIngredients();
    }
  }, [isOpen]);

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

  // Validation function
  const validateForm = (values: FormValues) => {
    const errors: any = {};

    // Name validation
    if (!values.name) {
      errors.name = 'Food item name is required';
    } else if (values.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    } else if (values.name.trim().length > 50) {
      errors.name = 'Name must be less than 50 characters';
    }

    // Description validation
    if (values.description && values.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    // Category validation
    if (!values.categoryId) {
      errors.categoryId = 'Please select a category';
    }

    // Portion prices validation
    if (!values.portionPrices || values.portionPrices.length === 0) {
      errors.portionPrices = 'At least one portion with price is required';
    } else {
      const validPortionPrices = values.portionPrices.filter(pp => pp.portionId && pp.price);
      
      if (validPortionPrices.length === 0) {
        errors.portionPrices = 'At least one portion with price is required';
      } else {
        // Check for duplicate portions
        const portionIds = validPortionPrices.map(pp => pp.portionId);
        const uniquePortionIds = new Set(portionIds);
        if (portionIds.length !== uniquePortionIds.size) {
          errors.portionPrices = 'Duplicate portions are not allowed';
        }

        // Validate individual portion prices and ingredients
        const portionErrors: any[] = [];
        validPortionPrices.forEach((pp, index) => {
          const portionError: any = {};
          
          // Price validation
          const price = parseFloat(pp.price);
          if (isNaN(price) || price <= 0) {
            portionError.price = 'Price must be a valid positive number';
          } else {
            // Check if price has more than 2 decimal places
            const priceString = pp.price.toString();
            const parts = priceString.split('.');
            if (parts.length > 1 && parts[1].length > 2) {
              portionError.price = 'Price can only have up to 2 decimal places';
            }
          }

          // Portion selection validation
          if (!pp.portionId) {
            portionError.portion = 'Please select a portion';
          }

          // Ingredients validation - ingredients are now optional
          if (pp.ingredients && pp.ingredients.length > 0) {
            // Validate each ingredient
            const ingredientErrors: any[] = [];
            pp.ingredients.forEach((ingredient, ingIndex) => {
              const ingError: any = {};
              
              if (!ingredient.ingredientId) {
                ingError.ingredientId = 'Please select an ingredient';
              }
              
              if (!ingredient.quantity || ingredient.quantity.trim() === '') {
                ingError.quantity = 'Quantity is required';
              } else {
                const quantity = parseFloat(ingredient.quantity);
                if (isNaN(quantity) || quantity <= 0) {
                  ingError.quantity = 'Quantity must be a valid positive number';
                } else {
                  // Check if quantity has more than 2 decimal places
                  const quantityString = ingredient.quantity.toString();
                  const qtyParts = quantityString.split('.');
                  if (qtyParts.length > 1 && qtyParts[1].length > 2) {
                    ingError.quantity = 'Quantity can only have up to 2 decimal places';
                  }
                }
              }
              
              if (Object.keys(ingError).length > 0) {
                ingredientErrors[ingIndex] = ingError;
              }
            });
            
            if (ingredientErrors.some(error => error)) {
              portionError.ingredients = ingredientErrors;
            }
          }

          if (Object.keys(portionError).length > 0) {
            portionErrors[index] = portionError;
          }
        });

        if (portionErrors.some(error => error)) {
          errors.portionPrices = portionErrors;
        }
      }
    }

    return errors;
  };

  const handlePortionPriceChange = (
    index: number, 
    field: 'portionId' | 'price', 
    value: string, 
    setFieldValue: (field: string, value: any) => void,
    values: FormValues
  ) => {
    const newPortionPrices = [...values.portionPrices];
    
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
      
      // Update with the validated value
      newPortionPrices[index] = { ...newPortionPrices[index], [field]: numericValue };
    } else {
    newPortionPrices[index] = { ...newPortionPrices[index], [field]: value };
    }
    
    setFieldValue('portionPrices', newPortionPrices);
  };

  const addPortionPrice = (setFieldValue: (field: string, value: any) => void, values: FormValues) => {
    setFieldValue('portionPrices', [...values.portionPrices, { 
      portionId: "", 
      price: "",
      ingredients: []
    }]);
  };

  const removePortionPrice = (index: number, setFieldValue: (field: string, value: any) => void, values: FormValues) => {
    if (values.portionPrices.length > 1) {
      const newPortionPrices = values.portionPrices.filter((_, i) => i !== index);
      setFieldValue('portionPrices', newPortionPrices);
    }
  };

  const addIngredientToPortion = (
    portionIndex: number,
    setFieldValue: (field: string, value: any) => void,
    values: FormValues
  ) => {
    const newPortionPrices = [...values.portionPrices];
    newPortionPrices[portionIndex].ingredients.push({
      ingredientId: "",
      quantity: "",
      selectedUnit: "g" as UnitType
    });
    setFieldValue('portionPrices', newPortionPrices);
  };

  const removeIngredientFromPortion = (
    portionIndex: number,
    ingredientIndex: number,
    setFieldValue: (field: string, value: any) => void,
    values: FormValues
  ) => {
    const newPortionPrices = [...values.portionPrices];
    newPortionPrices[portionIndex].ingredients.splice(ingredientIndex, 1);
    setFieldValue('portionPrices', newPortionPrices);
  };

  const handleIngredientChange = (
    portionIndex: number,
    ingredientIndex: number,
    field: 'ingredientId' | 'quantity' | 'selectedUnit',
    value: string,
    setFieldValue: (field: string, value: any) => void,
    values: FormValues
  ) => {
    const newPortionPrices = [...values.portionPrices];
    
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
    
    setFieldValue('portionPrices', newPortionPrices);
  };

  const getAvailableIngredients = (portionIndex: number, ingredientIndex: number, values: FormValues) => {
    const usedIngredientIds = values.portionPrices[portionIndex].ingredients
      .map((ing, index) => index !== ingredientIndex ? ing.ingredientId : null)
      .filter(Boolean);
    return ingredients.filter(ingredient => !usedIngredientIds.includes(ingredient.id));
  };

  const getIngredientUnit = (ingredientId: string) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    return ingredient ? ingredient.unitOfMeasurement : '';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    setIsUploadingImage(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedImage);

      // Upload via server-side endpoint
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
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

  const handlePortionInputChange = (index: number, value: string, setFieldValue: (field: string, value: any) => void, values: FormValues) => {
    const newSearchTerms = [...portionSearchTerms];
    newSearchTerms[index] = value;
    setPortionSearchTerms(newSearchTerms);
    
    // If user types something not in the portion list, show option to create
    const matchingPortion = portions.find(p => p.name.toLowerCase() === value.toLowerCase());
    if (!matchingPortion && value.trim()) {
      // User can still select from dropdown or create new
    }
  };

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError("");

    try {
      // Upload image if selected
      let imageUrl: string | null = null;
      if (selectedImage) {
        imageUrl = await uploadImage();
      }

      // Get valid portion prices
      const validPortionPrices = values.portionPrices.filter(pp => pp.portionId && pp.price);

      // Create food item with portions and ingredients
      const response = await fetch('/api/admin/food-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          categoryId: values.categoryId,
          imageUrl,
          portions: validPortionPrices.map(pp => ({
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
                ingredientId: ing.ingredientId,
                quantity: quantityInIngredientBaseUnit
              };
            })
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create food item');
      }

      // Reset form and close modal
      resetForm();
      onFoodItemAdded();
      onClose();
      showSuccessAlert('Food item created successfully!');

    } catch (err: any) {
      setError(err.message || "Failed to create food item");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getAvailablePortions = (currentIndex: number, values: FormValues) => {
    const usedPortionIds = values.portionPrices
      .map((pp, index) => index !== currentIndex ? pp.portionId : null)
      .filter(Boolean);
    return portions.filter(portion => !usedPortionIds.includes(portion.id));
  };

  const initialValues: FormValues = {
    name: "",
    description: "",
    categoryId: "",
    portionPrices: [{ portionId: "", price: "", ingredients: [] }]
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add New Food Item</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validate={validateForm}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, setFieldValue, handleChange, handleBlur, isValid, dirty }) => (
            <Form className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Food Item Name <span className="text-red-500">*</span>
            </label>
                <Field
              type="text"
              id="name"
              name="name"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name && touched.name ? 'border-red-500' : 'border-gray-300'
                  }`}
              placeholder="e.g., Margherita Pizza"
            />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
                <Field
                  as="textarea"
              id="description"
              name="description"
              rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description && touched.description ? 'border-red-500' : 'border-gray-300'
                  }`}
              placeholder="Describe the food item..."
            />
                <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
          </div>

          {/* Category Selection */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
            </label>
                <Field
                  as="select"
              id="categoryId"
              name="categoryId"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.categoryId && touched.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} {category.description && `- ${category.description}`}
                </option>
              ))}
                </Field>
                <ErrorMessage name="categoryId" component="div" className="text-red-500 text-sm mt-1" />
          </div>

          {/* Portion Sizes, Prices, and Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                    Portion Sizes, Prices & Ingredients <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPortionModal(true)}
                  className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-md hover:bg-purple-200 transition-colors"
                >
                  + Create New Portion
                </button>
                <button
                  type="button"
                      onClick={() => addPortionPrice(setFieldValue, values)}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors"
                >
                  + Add Portion
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
                  {values.portionPrices.map((portionPrice, portionIndex) => (
                <div key={portionIndex} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Portion {portionIndex + 1}</h4>
                    {values.portionPrices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePortionPrice(portionIndex, setFieldValue, values)}
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
                    <div className="relative">
                      <select
                        value={portionPrice.portionId}
                        onChange={(e) => handlePortionPriceChange(portionIndex, 'portionId', e.target.value, setFieldValue, values)}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.portionPrices && Array.isArray(errors.portionPrices) && errors.portionPrices[portionIndex] && typeof errors.portionPrices[portionIndex] === 'object' && 'portion' in errors.portionPrices[portionIndex] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select or create portion</option>
                        {getAvailablePortions(portionIndex, values).map((portion) => (
                          <option key={portion.id} value={portion.id}>
                            {portion.name} {portion.description && `- ${portion.description}`}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 text-xs text-gray-500">
                        Don't see your portion? Click "Create New Portion" button above
                      </div>
                      {errors.portionPrices && Array.isArray(errors.portionPrices) && errors.portionPrices[portionIndex] && typeof errors.portionPrices[portionIndex] === 'object' && 'portion' in errors.portionPrices[portionIndex] && (
                        <div className="text-red-500 text-xs mt-1">{(errors.portionPrices[portionIndex] as any).portion}</div>
                      )}
                    </div>
                    
                    <div>
                      <input
                        type="number"
                        value={portionPrice.price}
                        onChange={(e) => handlePortionPriceChange(portionIndex, 'price', e.target.value, setFieldValue, values)}
                        onBlur={handleBlur}
                        min="0"
                        step="0.01"
                        placeholder="Price (Rs.)"
                        pattern="[0-9]*\.?[0-9]{0,2}"
                        title="Please enter a valid price with up to 2 decimal places"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.portionPrices && Array.isArray(errors.portionPrices) && errors.portionPrices[portionIndex] && typeof errors.portionPrices[portionIndex] === 'object' && 'price' in errors.portionPrices[portionIndex] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.portionPrices && Array.isArray(errors.portionPrices) && errors.portionPrices[portionIndex] && typeof errors.portionPrices[portionIndex] === 'object' && 'price' in errors.portionPrices[portionIndex] && (
                        <div className="text-red-500 text-xs mt-1">{(errors.portionPrices[portionIndex] as any).price}</div>
                      )}
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
                          onClick={() => addIngredientToPortion(portionIndex, setFieldValue, values)}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md hover:bg-green-200 transition-colors"
                        >
                          + Add Ingredient
                        </button>
                      </div>
                    </div>
                    
                    {/* Ingredients validation error */}
                    {errors.portionPrices && Array.isArray(errors.portionPrices) && errors.portionPrices[portionIndex] && typeof errors.portionPrices[portionIndex] === 'object' && 'ingredients' in errors.portionPrices[portionIndex] && typeof (errors.portionPrices[portionIndex] as any).ingredients === 'string' && (
                      <div className="text-red-500 text-xs mb-2">{(errors.portionPrices[portionIndex] as any).ingredients}</div>
                    )}
                    
                    <div className="space-y-2">
                      {portionPrice.ingredients.map((ingredient, ingredientIndex) => {
                        const selectedIngredient = ingredients.find(ing => ing.id === ingredient.ingredientId);
                        const availableUnits = selectedIngredient ? getAvailableUnits(selectedIngredient.unitOfMeasurement as UnitType) : [];
                        
                        const ingredientErrors = errors.portionPrices && Array.isArray(errors.portionPrices) && errors.portionPrices[portionIndex] && typeof errors.portionPrices[portionIndex] === 'object' && 'ingredients' in errors.portionPrices[portionIndex] && Array.isArray((errors.portionPrices[portionIndex] as any).ingredients) ? (errors.portionPrices[portionIndex] as any).ingredients[ingredientIndex] : null;
                        
                        return (
                          <div key={ingredientIndex} className="space-y-1">
                            <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                              <div className="flex-1">
                                <select
                                  value={ingredient.ingredientId}
                                  onChange={(e) => handleIngredientChange(portionIndex, ingredientIndex, 'ingredientId', e.target.value, setFieldValue, values)}
                                  className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    ingredientErrors?.ingredientId ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">Select ingredient</option>
                                  {getAvailableIngredients(portionIndex, ingredientIndex, values).map((ing) => (
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
                                  onChange={(e) => handleIngredientChange(portionIndex, ingredientIndex, 'quantity', e.target.value, setFieldValue, values)}
                                  min="0"
                                  step="0.01"
                                  placeholder="Quantity"
                                  className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    ingredientErrors?.quantity ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                />
                              </div>
                              
                              <div className="w-20">
                                <select
                                  value={ingredient.selectedUnit}
                                  onChange={(e) => handleIngredientChange(portionIndex, ingredientIndex, 'selectedUnit', e.target.value, setFieldValue, values)}
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
                                onClick={() => removeIngredientFromPortion(portionIndex, ingredientIndex, setFieldValue, values)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            
                            {/* Individual ingredient validation errors */}
                            {ingredientErrors && (
                              <div className="ml-2 space-y-1">
                                {ingredientErrors.ingredientId && (
                                  <div className="text-red-500 text-xs">{ingredientErrors.ingredientId}</div>
                                )}
                                {ingredientErrors.quantity && (
                                  <div className="text-red-500 text-xs">{ingredientErrors.quantity}</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
                
                {/* Portion prices error message */}
                {errors.portionPrices && typeof errors.portionPrices === 'string' && (
                  <div className="text-red-500 text-sm mt-1">{errors.portionPrices}</div>
                )}
                
                {/* Individual portion price errors */}
                {errors.portionPrices && Array.isArray(errors.portionPrices) && (
                  <div className="space-y-1 mt-1">
                    {errors.portionPrices.map((error, index) => 
                      error && typeof error === 'string' ? (
                        <div key={index} className="text-red-500 text-sm">Portion {index + 1}: {error}</div>
                      ) : error && typeof error === 'object' ? (
                        <div key={index} className="text-red-500 text-sm">
                          Portion {index + 1}: 
                          {'portion' in error && <div className="ml-2">- {(error as any).portion}</div>}
                          {'price' in error && <div className="ml-2">- {(error as any).price}</div>}
                          {'ingredients' in error && typeof (error as any).ingredients === 'string' && <div className="ml-2">- {(error as any).ingredients}</div>}
                        </div>
                      ) : null
                    )}
                  </div>
                )}
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              Food Image
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: 5MB. Supported formats: JPG, PNG, WebP
            </p>
            
            {imagePreview && (
              <div className="mt-3">
                <p className="text-sm text-gray-700 mb-2">Image Preview:</p>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md border border-gray-300"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
                  disabled={isLoading || isUploadingImage || !isValid || !dirty}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-md hover:from-blue-700 hover:to-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isUploadingImage ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isUploadingImage ? 'Uploading...' : 'Creating...'}
                </div>
              ) : (
                "Add Food Item"
              )}
            </button>
          </div>
            </Form>
          )}
        </Formik>
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