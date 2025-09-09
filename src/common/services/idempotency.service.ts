import { Injectable } from '@nestjs/common';

interface StoredResult<T = any> {
  status: number;
  value: T;
  timestamp: number;
}

@Injectable()
export class IdempotencyService {
  private readonly store = new Map<string, StoredResult>();
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutes

  get<T = any>(key: string): StoredResult<T> | undefined {
    const item = this.store.get(key);
    if (!item) return undefined;
    if (Date.now() - item.timestamp > this.ttlMs) {
      this.store.delete(key);
      return undefined;
    }
    return item as StoredResult<T>;
  }

  set<T = any>(key: string, status: number, value: T): void {
    this.store.set(key, { status, value, timestamp: Date.now() });
  }
}


