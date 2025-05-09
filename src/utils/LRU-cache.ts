/**
 * LRUCache class: Least Recently Used cache with a fixed capacity
 * 
 * Provided by ChatGPT.
 */
export class LRUCache<K extends string, V> {
    private cache: Record<K, V>;   // Stores the actual key-value pairs
    private next: Record<K, K>;    // Linked list: points to the next newer key
    private prev: Record<K, K>;    // Linked list: points to the previous older key
    private head: K | null;        // The least recently used key (oldest)
    private tail: K | null;        // The most recently used key (newest)
    private capacity: number;      // Maximum number of items allowed
    private size: number;          // Current number of items
    private maxKeyLength: number;  // Maximum key length.

    constructor(maxSize: number, maxKeyLength: number = Infinity) {
        this.cache = Object.create(null);
        this.next = Object.create(null);
        this.prev = Object.create(null);
        this.head = null;
        this.tail = null;
        this.capacity = maxSize;
        this.size = 0;
        this.maxKeyLength = maxKeyLength;
    }

    // Retrieves a value from the cache
    get(key: K): V | undefined {
        if (key.length > this.maxKeyLength) return undefined;

        if (this.cache[key] !== undefined) {
            this.touch(key); // Mark as recently used
            return this.cache[key];
        }
        return undefined; // Key not found
    }

    set(key: K, value: V): void {
        if (key.length > this.maxKeyLength) {
            // Skip caching for keys that are too large
            return;
        }

        if (this.cache[key] !== undefined) {
            // Update value and mark as recently used
            this.cache[key] = value;
            this.touch(key);
            return;
        }

        // If cache is full, evict the least recently used item
        if (this.size >= this.capacity) {
            this.evict();
        }

        // Add new entry to the cache and to the tail (most recent)
        this.cache[key] = value;
        this.addToTail(key);
        this.size++;
    }

    // Marks a key as most recently used
    private touch(key: K): void {
        if (this.tail === key) return; // Already the most recently used

        this.removeKey(key); // Remove from current position
        this.addToTail(key); // Re-add at the tail
    }

    // Evicts the least recently used item (at the head)
    private evict(): void {
        if (this.head !== null) {
            const oldestKey = this.head;
            this.removeKey(oldestKey); // Remove from the linked list
            delete this.cache[oldestKey]; // Remove from cache storage
            this.size--;
        }
    }

    // Removes a key from the linked list
    private removeKey(key: K): void {
        const prevKey = this.prev[key];
        const nextKey = this.next[key];

        if (prevKey !== undefined) {
            this.next[prevKey] = nextKey;
        }
        else {
            // If no previous key, this was the head
            this.head = nextKey ?? null;
        }

        if (nextKey !== undefined) {
            this.prev[nextKey] = prevKey;
        }
        else {
            // If no next key, this was the tail
            this.tail = prevKey ?? null;
        }

        // Clean up links
        delete this.prev[key];
        delete this.next[key];
    }

    // Adds a key to the tail (most recently used position)
    private addToTail(key: K): void {
        if (this.tail !== null) {
            // Link the current tail to the new key
            this.next[this.tail] = key;
            this.prev[key] = this.tail;
        }
        else {
            // If the cache was empty, set as head
            this.head = key;
        }
        this.tail = key; // Always set as new tail
    }
}
