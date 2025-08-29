import { Injectable, signal, WritableSignal } from '@angular/core';
import { Table, TableStatus } from '../models/restaurant.models';

@Injectable({
  providedIn: 'root',
})
export class PdvService {
  tables: WritableSignal<Table[]> = signal([]);
  private readonly TOTAL_TABLES = 20;

  constructor() {
    this.initializeTables();
  }

  private initializeTables() {
    const initialTables: Table[] = [];
    for (let i = 1; i <= this.TOTAL_TABLES; i++) {
      initialTables.push({ number: i, status: TableStatus.Free });
    }
    this.tables.set(initialTables);
  }

  updateTableStatus(tableNumber: number, status: TableStatus) {
    this.tables.update(tables =>
      tables.map(table =>
        table.number === tableNumber ? { ...table, status } : table
      )
    );
  }
}
