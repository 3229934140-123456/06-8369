export class MemoryRepository<T extends { id: string }> {
  private items: Map<string, T>;

  constructor(initial: T[] = []) {
    this.items = new Map(initial.map(i => [i.id, i]));
  }

  findAll(): T[] {
    return Array.from(this.items.values());
  }

  findById(id: string): T | undefined {
    return this.items.get(id);
  }

  findMany(predicate: (item: T) => boolean): T[] {
    return this.findAll().filter(predicate);
  }

  findOne(predicate: (item: T) => boolean): T | undefined {
    return this.findAll().find(predicate);
  }

  create(item: T): T {
    this.items.set(item.id, item);
    return item;
  }

  update(id: string, changes: Partial<T>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...changes } as T;
    this.items.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }

  count(): number {
    return this.items.size;
  }
}
