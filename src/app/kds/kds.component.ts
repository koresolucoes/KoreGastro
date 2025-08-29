import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../services/restaurant.service';
import { GeminiService } from '../../services/gemini.service';
import { Order, OrderDestination, OrderItemStatus, Recipe } from '../../models/restaurant.models';

@Component({
  selector: 'app-kds',
  templateUrl: './kds.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class KdsComponent implements OnInit, OnDestroy {
  restaurantService = inject(RestaurantService);
  geminiService = inject(GeminiService);

  // Expose enums to the template
  public OrderDestination = OrderDestination;
  public OrderItemStatus = OrderItemStatus;
  
  // UI State
  currentView = signal<'kds' | 'recipe_editor'>('kds');
  activeTab = signal<OrderDestination>(OrderDestination.Kitchen);
  currentTime = signal(new Date());
  private timerInterval: any;

  // KDS Data
  orders = this.restaurantService.orders;
  filteredOrders = computed(() => 
    this.orders()
      .filter(order => order.destination === this.activeTab())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  );

  // Recipe Editor State
  newRecipeName = signal('');
  newRecipeDescription = signal('');
  newRecipeCategory = signal<'Cozinha' | 'Bar'>('Cozinha');
  newRecipeIngredients: WritableSignal<{ingredientId: string, quantity: number}[]> = signal([]);
  availableIngredients = this.restaurantService.ingredients;
  
  // Gemini State
  geminiPrompt = signal('');
  geminiSuggestion = signal('');

  ngOnInit() {
    this.timerInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  isOrderReady(order: Order): boolean {
    return order.items.every(item => item.status === OrderItemStatus.Ready);
  }

  isNewOrder(order: Order): boolean {
    const ageInSeconds = (this.currentTime().getTime() - order.timestamp.getTime()) / 1000;
    // Highlight if new (under 30s) and fully pending
    return ageInSeconds < 30 && order.items.every(i => i.status === OrderItemStatus.Pending);
  }

  elapsedTime(timestamp: Date): string {
    const now = this.currentTime();
    const seconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  getElapsedTimeColor(timestamp: Date): string {
    const minutes = Math.floor((this.currentTime().getTime() - timestamp.getTime()) / 1000 / 60);
    if (minutes >= 10) return 'bg-red-500';
    if (minutes >= 5) return 'bg-yellow-500';
    return 'bg-blue-500';
  }
  
  getItemStatusColor(status: OrderItemStatus): string {
    switch (status) {
      case OrderItemStatus.Pending: return 'border-gray-500 text-gray-400';
      case OrderItemStatus.InProgress: return 'border-blue-500 text-blue-300';
      case OrderItemStatus.Ready: return 'border-green-500 text-green-300';
      default: return 'border-gray-600';
    }
  }

  printOrder(order: Order) {
    const printContent = `
      <html>
        <head><title>Comanda Mesa ${order.tableNumber}</title>
        <style>
          body { font-family: monospace; }
          h1 { text-align: center; }
          ul { list-style: none; padding: 0; }
          li { margin-bottom: 5px; }
        </style>
        </head>
        <body>
          <h1>MESA ${order.tableNumber}</h1>
          <p>Horário: ${order.timestamp.toLocaleTimeString()}</p>
          <hr>
          <ul>
            ${order.items.map(item => `<li>${item.quantity}x ${item.name} ${item.notes ? `(${item.notes})` : ''}</li>`).join('')}
          </ul>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(printContent);
    printWindow?.document.close();
    printWindow?.print();
  }

  // Recipe Editor methods
  addIngredientToRecipe() {
    const firstIngredient = this.availableIngredients()[0];
    if (firstIngredient) {
      this.newRecipeIngredients.update(ingredients => [
        ...ingredients, 
        { ingredientId: firstIngredient.id, quantity: 0 }
      ]);
    }
  }

  removeIngredientFromRecipe(index: number) {
    this.newRecipeIngredients.update(ingredients => ingredients.filter((_, i) => i !== index));
  }

  saveNewRecipe() {
    if (!this.newRecipeName() || this.newRecipeIngredients().length === 0) {
      alert("O nome da ficha e pelo menos um ingrediente são obrigatórios.");
      return;
    }
    const recipeData = {
      name: this.newRecipeName(),
      description: this.newRecipeDescription(),
      category: this.newRecipeCategory(),
      ingredients: this.newRecipeIngredients()
    };
    this.restaurantService.addRecipe(recipeData);
    // Reset form
    this.newRecipeName.set('');
    this.newRecipeDescription.set('');
    this.newRecipeIngredients.set([]);
    this.currentView.set('kds');
  }

  getIngredientUnit(ingredientId: string): string {
    return this.availableIngredients().find(i => i.id === ingredientId)?.unit || 'un';
  }

  // Gemini methods
  async generateSuggestion() {
    if (!this.geminiPrompt() || this.geminiService.loading()) return;
    const result = await this.geminiService.suggestRecipe(this.geminiPrompt());
    this.geminiSuggestion.set(result);
    
    // Auto-fill form fields
    const nameMatch = result.match(/NOME DO PRATO: (.*)/);
    const descMatch = result.match(/DESCRIÇÃO: (.*)/);
    if (nameMatch && nameMatch[1]) {
      this.newRecipeName.set(nameMatch[1].trim());
    }
    if (descMatch && descMatch[1]) {
      this.newRecipeDescription.set(descMatch[1].trim());
    }
  }
}