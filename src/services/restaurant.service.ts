import { Injectable, signal, WritableSignal, inject } from '@angular/core';
import { Order, OrderItemStatus, OrderDestination, Recipe, Ingredient, RecipeIngredient } from '../models/restaurant.models';

@Injectable({
  providedIn: 'root',
})
export class RestaurantService {
  orders: WritableSignal<Order[]> = signal([]);
  recipes: WritableSignal<Recipe[]> = signal([]);
  ingredients: WritableSignal<Ingredient[]> = signal([]);

  constructor() {
    this.loadInitialData();
  }
  
  addOrder(order: Order) {
    this.orders.update(currentOrders => [order, ...currentOrders]);
  }

  updateItemStatus(orderId: string, itemId: string, status: OrderItemStatus) {
    this.orders.update(orders =>
      orders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            items: order.items.map(item =>
              item.id === itemId ? { ...item, status } : item
            ),
          };
        }
        return order;
      })
    );
  }

  completeOrder(orderId: string) {
    const orderToComplete = this.orders().find(o => o.id === orderId);
    if (!orderToComplete) return;

    console.log(`--- DANDO BAIXA NO ESTOQUE PARA O PEDIDO DA MESA ${orderToComplete.tableNumber} ---`);
    for (const item of orderToComplete.items) {
      const recipe = this.recipes().find(r => r.id === item.recipeId);
      if (recipe) {
        console.log(`Item: ${item.quantity}x ${recipe.name}`);
        for (const recipeIngredient of recipe.ingredients) {
          const ingredient = this.ingredients().find(i => i.id === recipeIngredient.ingredientId);
          if(ingredient) {
            const totalQuantityDeducted = recipeIngredient.quantity * item.quantity;
            console.log(` -> Deduzindo ${totalQuantityDeducted}${ingredient.unit} de ${ingredient.name}`);
            this.ingredients.update(ingredients => ingredients.map(ing => 
              ing.id === ingredient.id ? {...ing, stock: ing.stock - totalQuantityDeducted} : ing
            ));
          }
        }
      }
    }
    console.log('----------------------------------------------------');

    this.orders.update(orders => orders.filter(order => order.id !== orderId));
    // In a real app, you might notify another service that the table can be billed or cleaned.
  }
  
  addRecipe(recipe: Omit<Recipe, 'id'>) {
    const newRecipe: Recipe = { ...recipe, id: `recipe-${Date.now()}` };
    this.recipes.update(recipes => [...recipes, newRecipe]);
    console.log("Nova ficha técnica adicionada:", newRecipe);
  }

  private loadInitialData() {
    const ingredients: Ingredient[] = [
      { id: 'ing-1', name: 'Pão de Hambúrguer', unit: 'un', stock: 100 },
      { id: 'ing-2', name: 'Carne de Hambúrguer 150g', unit: 'un', stock: 80 },
      { id: 'ing-3', name: 'Queijo Cheddar', unit: 'g', stock: 2000 },
      { id: 'ing-4', name: 'Alface', unit: 'g', stock: 1000 },
      { id: 'ing-5', name: 'Tomate', unit: 'g', stock: 1500 },
      { id: 'ing-6', name: 'Bacon', unit: 'g', stock: 1000 },
      { id: 'ing-7', name: 'Batata', unit: 'kg', stock: 10 },
      { id: 'ing-8', name: 'Cerveja Lager', unit: 'ml', stock: 50000 },
      { id: 'ing-9', name: 'Suco de Laranja', unit: 'l', stock: 20 },
      { id: 'ing-10', name: 'Refrigerante', unit: 'ml', stock: 60000 },
    ];
    this.ingredients.set(ingredients);

    const recipes: Recipe[] = [
      {
        id: 'recipe-1', name: 'X-Burger Clássico', description: 'O de sempre, perfeito.', category: 'Cozinha',
        ingredients: [
          { ingredientId: 'ing-1', quantity: 1 },
          { ingredientId: 'ing-2', quantity: 1 },
          { ingredientId: 'ing-3', quantity: 40 },
        ],
      },
      {
        id: 'recipe-2', name: 'X-Salada da Casa', description: 'Refrescante e delicioso.', category: 'Cozinha',
        ingredients: [
          { ingredientId: 'ing-1', quantity: 1 },
          { ingredientId: 'ing-2', quantity: 1 },
          { ingredientId: 'ing-3', quantity: 20 },
          { ingredientId: 'ing-4', quantity: 30 },
          { ingredientId: 'ing-5', quantity: 50 },
        ],
      },
      {
        id: 'recipe-3', name: 'Porção de Fritas', description: 'Crocantes e irresistíveis.', category: 'Cozinha',
        ingredients: [{ ingredientId: 'ing-7', quantity: 0.3 }],
      },
      {
        id: 'recipe-4', name: 'Chopp Lager 500ml', description: 'Gelado e na medida.', category: 'Bar',
        ingredients: [{ ingredientId: 'ing-8', quantity: 500 }],
      },
      {
        id: 'recipe-5', name: 'Suco de Laranja 400ml', description: 'Natural e fresco.', category: 'Bar',
        ingredients: [{ ingredientId: 'ing-9', quantity: 0.4 }],
      },
       {
        id: 'recipe-6', name: 'Refrigerante Lata', description: 'Consulte sabores.', category: 'Bar',
        ingredients: [{ ingredientId: 'ing-10', quantity: 350 }],
      },
    ];
    this.recipes.set(recipes);

    // Initial orders are removed, they will now come from the PDV
    this.orders.set([]); 
  }
}
