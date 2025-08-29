export interface Ingredient {
  id: string;
  name: string;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'un';
  stock: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
}

export enum OrderItemStatus {
  Pending = 'PENDENTE',
  InProgress = 'EM_PREPARO',
  Ready = 'PRONTO',
}

export interface OrderItem {
  id: string;
  recipeId: string;
  name: string;
  quantity: number;
  notes?: string;
  status: OrderItemStatus;
}

export enum OrderDestination {
  Kitchen = 'COZINHA',
  Bar = 'BAR',
}

export interface Order {
  id: string;
  tableNumber: number;
  timestamp: Date;
  items: OrderItem[];
  destination: OrderDestination;
}
