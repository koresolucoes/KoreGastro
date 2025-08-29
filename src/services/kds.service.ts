import { Injectable, signal, WritableSignal } from '@angular/core';
import { Order, OrderItemStatus, OrderDestination, Recipe, Ingredient, RecipeIngredient } from '../models/kds.models';

@Injectable({
  providedIn: 'root',
})
export class KdsService {
  orders: WritableSignal<Order[]> = signal([]);
  recipes: WritableSignal<Recipe[]> = signal([]);
  ingredients: WritableSignal<Ingredient[]> = signal([]);

  constructor() {
    this.loadInitialData();
    // Simulate new orders coming in
    setInterval(() => this.simulateNewOrder(), 15000);
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
            // Here you would update the actual ingredient stock
            this.ingredients.update(ingredients => ingredients.map(ing => 
              ing.id === ingredient.id ? {...ing, stock: ing.stock - totalQuantityDeducted} : ing
            ));
          }
        }
      }
    }
    console.log('----------------------------------------------------');

    this.orders.update(orders => orders.filter(order => order.id !== orderId));
  }
  
  addRecipe(recipe: Omit<Recipe, 'id'>) {
    const newRecipe: Recipe = { ...recipe, id: `recipe-${Date.now()}` };
    this.recipes.update(recipes => [...recipes, newRecipe]);
    console.log("Nova ficha técnica adicionada:", newRecipe);
  }
  
  private simulateNewOrder() {
    const isKitchen = Math.random() > 0.4;
    const destination = isKitchen ? OrderDestination.Kitchen : OrderDestination.Bar;
    const availableRecipes = this.recipes().filter(r => 
        (isKitchen && ['recipe-1', 'recipe-2', 'recipe-3'].includes(r.id)) ||
        (!isKitchen && ['recipe-4', 'recipe-5'].includes(r.id))
    );

    if (availableRecipes.length === 0) return;

    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    for(let i = 0; i < numItems; i++) {
        const randomRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
        items.push({
          id: `item-${Date.now()}-${i}`,
          recipeId: randomRecipe.id,
          name: randomRecipe.name,
          quantity: 1,
          status: OrderItemStatus.Pending,
        });
    }

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      tableNumber: Math.floor(Math.random() * 20) + 1,
      timestamp: new Date(),
      items: items,
      destination: destination,
    };
    this.orders.update(currentOrders => [newOrder, ...currentOrders]);
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
        id: 'recipe-1', name: 'X-Burger Clássico', description: 'O de sempre, perfeito.',
        ingredients: [
          { ingredientId: 'ing-1', quantity: 1 },
          { ingredientId: 'ing-2', quantity: 1 },
          { ingredientId: 'ing-3', quantity: 40 },
        ],
      },
      {
        id: 'recipe-2', name: 'X-Salada da Casa', description: 'Refrescante e delicioso.',
        ingredients: [
          { ingredientId: 'ing-1', quantity: 1 },
          { ingredientId: 'ing-2', quantity: 1 },
          { ingredientId: 'ing-3', quantity: 20 },
          { ingredientId: 'ing-4', quantity: 30 },
          { ingredientId: 'ing-5', quantity: 50 },
        ],
      },
      {
        id: 'recipe-3', name: 'Porção de Fritas', description: 'Crocantes e irresistíveis.',
        ingredients: [{ ingredientId: 'ing-7', quantity: 0.3 }],
      },
      {
        id: 'recipe-4', name: 'Chopp Lager 500ml', description: 'Gelado e na medida.',
        ingredients: [{ ingredientId: 'ing-8', quantity: 500 }],
      },
      {
        id: 'recipe-5', name: 'Suco de Laranja 400ml', description: 'Natural e fresco.',
        ingredients: [{ ingredientId: 'ing-9', quantity: 0.4 }],
      },
    ];
    this.recipes.set(recipes);

    const initialOrders: Order[] = [
      {
        id: 'order-1', tableNumber: 5, timestamp: new Date(Date.now() - 60000 * 2),
        destination: OrderDestination.Kitchen,
        items: [
          { id: 'item-1a', recipeId: 'recipe-1', name: 'X-Burger Clássico', quantity: 2, status: OrderItemStatus.Pending },
          { id: 'item-1b', recipeId: 'recipe-3', name: 'Porção de Fritas', quantity: 1, status: OrderItemStatus.Pending, notes: 'Sem sal' },
        ],
      },
      {
        id: 'order-2', tableNumber: 12, timestamp: new Date(Date.now() - 60000 * 5),
        destination: OrderDestination.Bar,
        items: [
          { id: 'item-2a', recipeId: 'recipe-4', name: 'Chopp Lager 500ml', quantity: 1, status: OrderItemStatus.InProgress },
          { id: 'item-2b', recipeId: 'recipe-5', name: 'Suco de Laranja 400ml', quantity: 1, status: OrderItemStatus.Pending },
        ],
      },
      {
        id: 'order-3', tableNumber: 8, timestamp: new Date(Date.now() - 60000 * 8),
        destination: OrderDestination.Kitchen,
        items: [
          { id: 'item-3a', recipeId: 'recipe-2', name: 'X-Salada da Casa', quantity: 1, status: OrderItemStatus.Ready },
          { id: 'item-3b', recipeId: 'recipe-1', name: 'X-Burger Clássico', quantity: 1, status: OrderItemStatus.InProgress },
        ],
      },
    ];
    this.orders.set(initialOrders);
  }
}
