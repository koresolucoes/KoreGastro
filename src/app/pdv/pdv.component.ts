import { Component, ChangeDetectionStrategy, inject, signal, computed, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdvService } from '../../services/pdv.service';
import { RestaurantService } from '../../services/restaurant.service';
import { Table, TableStatus, Recipe, OrderItem, OrderDestination, OrderItemStatus } from '../../models/restaurant.models';
import { FormsModule } from '@angular/forms';

type OrderItemDraft = Omit<OrderItem, 'id' | 'status'>;

@Component({
  selector: 'app-pdv',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdv.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdvComponent {
  pdvService = inject(PdvService);
  restaurantService = inject(RestaurantService);

  // Expose enums
  TableStatus = TableStatus;

  // Component State
  tables = this.pdvService.tables;
  selectedTable = signal<Table | null>(null);
  isModalOpen = signal(false);
  currentOrderItems: WritableSignal<OrderItemDraft[]> = signal([]);

  // Menu data derived from restaurant service
  menu = computed(() => {
    const recipes = this.restaurantService.recipes();
    const kitchenItems = recipes.filter(r => r.category === 'Cozinha');
    const barItems = recipes.filter(r => r.category === 'Bar');
    return [
      { category: 'Cozinha', items: kitchenItems },
      { category: 'Bar', items: barItems },
    ];
  });

  getTableStatusClass(status: TableStatus): string {
    switch (status) {
      case TableStatus.Free:
        return 'bg-green-500/20 border-green-500 hover:bg-green-500/40';
      case TableStatus.Occupied:
        return 'bg-yellow-500/20 border-yellow-500 cursor-not-allowed';
      case TableStatus.Billing:
        return 'bg-red-500/20 border-red-500 cursor-not-allowed';
      default:
        return 'bg-gray-700';
    }
  }

  selectMesa(table: Table) {
    if (table.status === TableStatus.Free) {
      this.selectedTable.set(table);
      this.currentOrderItems.set([]);
      this.isModalOpen.set(true);
    }
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedTable.set(null);
    this.currentOrderItems.set([]);
  }

  addItemToOrder(recipe: Recipe) {
    this.currentOrderItems.update(items => {
      const existingItem = items.find(item => item.recipeId === recipe.id);
      if (existingItem) {
        return items.map(item =>
          item.recipeId === recipe.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...items, { recipeId: recipe.id, name: recipe.name, quantity: 1 }];
    });
  }

  incrementItemInOrder(recipeId: string) {
    const recipe = this.restaurantService.recipes().find(r => r.id === recipeId);
    if (recipe) {
      this.addItemToOrder(recipe);
    }
  }
  
  removeItem(recipeId: string) {
    this.currentOrderItems.update(items => {
       const existingItem = items.find(item => item.recipeId === recipeId);
       if(existingItem && existingItem.quantity > 1) {
         return items.map(item => item.recipeId === recipeId ? {...item, quantity: item.quantity - 1} : item);
       }
       return items.filter(item => item.recipeId !== recipeId);
    });
  }

  submitOrder() {
    const table = this.selectedTable();
    const items = this.currentOrderItems();
    if (!table || items.length === 0) return;

    const kitchenItems: OrderItem[] = [];
    const barItems: OrderItem[] = [];

    const allRecipes = this.restaurantService.recipes();

    items.forEach((draftItem, index) => {
      const recipe = allRecipes.find(r => r.id === draftItem.recipeId);
      if (recipe) {
        const fullItem: OrderItem = {
          ...draftItem,
          id: `item-${Date.now()}-${index}`,
          status: OrderItemStatus.Pending
        };
        if (recipe.category === 'Cozinha') {
          kitchenItems.push(fullItem);
        } else {
          barItems.push(fullItem);
        }
      }
    });

    if (kitchenItems.length > 0) {
      this.restaurantService.addOrder({
        id: `order-${Date.now()}-k`,
        tableNumber: table.number,
        timestamp: new Date(),
        items: kitchenItems,
        destination: OrderDestination.Kitchen
      });
    }

    if (barItems.length > 0) {
      this.restaurantService.addOrder({
        id: `order-${Date.now()}-b`,
        tableNumber: table.number,
        timestamp: new Date(),
        items: barItems,
        destination: OrderDestination.Bar
      });
    }

    this.pdvService.updateTableStatus(table.number, TableStatus.Occupied);
    this.closeModal();
  }
}