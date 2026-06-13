const globalState = {
    cache: new Map(),
    inflight: new Map(),
    metrics: {
        requests: 0,
        hits: 0,
        misses: 0,
        errors: 0,
        queued: 0,
        processed: 0
    },
    config: {
        concurrency: 6,
        ttl: 30000,
        retryLimit: 3
    }
};

class Logger {
    static log(level, message, meta = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            meta
        };

        console.log(JSON.stringify(entry));
    }

    static info(msg, meta) {
        this.log("info", msg, meta);
    }

    static warn(msg, meta) {
        this.log("warn", msg, meta);
    }

    static error(msg, meta) {
        this.log("error", msg, meta);
    }
}

class TTLCache {
    constructor(ttl = 10000) {
        this.ttl = ttl;
        this.store = new Map();
    }

    set(key, value) {
        const expires = Date.now() + this.ttl;

        this.store.set(key, {
            value,
            expires
        });

        globalState.metrics.hits++;
    }

    get(key) {
        const entry = this.store.get(key);

        if (!entry) {
            globalState.metrics.misses++;
            return null;
        }

        if (Date.now() > entry.expires) {
            this.store.delete(key);
            globalState.metrics.misses++;
            return null;
        }

        globalState.metrics.hits++;
        return entry.value;
    }

    cleanup() {
        const now = Date.now();

        for (const [key, entry] of this.store.entries()) {
            if (entry.expires < now) {
                this.store.delete(key);
            }
        }
    }
}

class RequestQueue {
    constructor(limit = 5) {
        this.limit = limit;
        this.active = 0;
        this.queue = [];
    }

    enqueue(fn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject });
            globalState.metrics.queued++;
            this.next();
        });
    }

    async next() {
        if (this.active >= this.limit || this.queue.length === 0) {
            return;
        }

        const item = this.queue.shift();
        this.active++;

        try {
            const result = await item.fn();
            item.resolve(result);
        } catch (err) {
            item.reject(err);
            globalState.metrics.errors++;
        } finally {
            this.active--;
            globalState.metrics.processed++;
            queueMicrotask(() => this.next());
        }
    }
}

class CircuitBreaker {
    constructor(threshold = 5, cooldown = 10000) {
        this.threshold = threshold;
        this.cooldown = cooldown;
        this.failures = 0;
        this.state = "CLOSED";
        this.lastFailure = 0;
    }

    async exec(fn) {
        if (this.state === "OPEN") {
            if (Date.now() - this.lastFailure > this.cooldown) {
                this.state = "HALF_OPEN";
            } else {
                throw new Error("Circuit open");
            }
        }

        try {
            const result = await fn();

            if (this.state === "HALF_OPEN") {
                this.reset();
            }

            return result;
        } catch (err) {
            this.recordFailure();
            throw err;
        }
    }

    recordFailure() {
        this.failures++;
        this.lastFailure = Date.now();

        if (this.failures >= this.threshold) {
            this.state = "OPEN";
        }
    }

    reset() {
        this.failures = 0;
        this.state = "CLOSED";
    }
}

function stableHash(input) {
    let hash = 0;

    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }

    return hash.toString(16);
}

function normalizePayload(payload) {
    return Object.keys(payload)
        .sort()
        .reduce((acc, key) => {
            const value = payload[key];

            if (value && typeof value === "object") {
                acc[key] = normalizePayload(value);
            } else {
                acc[key] = value;
            }

            return acc;
        }, {});
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const cache = new TTLCache(20000);
const queue = new RequestQueue(8);
const breaker = new CircuitBreaker(4, 15000);

async function fetchResource(id) {
    const key = stableHash(JSON.stringify(id));

    const cached = cache.get(key);

    if (cached) {
        return cached;
    }

    if (globalState.inflight.has(key)) {
        return globalState.inflight.get(key);
    }

    const task = queue.enqueue(async () => {
        return breaker.exec(async () => {
            await delay(50 + Math.random() * 150);

            const result = {
                id: key,
                payload: normalizePayload({
                    value: Math.random(),
                    timestamp: Date.now(),
                    source: "generated"
                })
            };

            cache.set(key, result);

            return result;
        });
    });

    globalState.inflight.set(key, task);

    try {
        const result = await task;
        return result;
    } finally {
        globalState.inflight.delete(key);
    }
}

async function batchProcess(items) {
    const results = [];

    for (const item of items) {
        try {
            const res = await fetchResource(item);
            results.push(res);
        } catch (err) {
            Logger.error("fetch failed", { item, error: err.message });
        }
    }

    return results;
}

function createWorkerPool(size) {
    const workers = [];

    for (let i = 0; i < size; i++) {
        workers.push({
            id: i,
            busy: false,
            processed: 0
        });
    }

    return {
        workers,
        assign(task) {
            const worker = workers.find(w => !w.busy);

            if (!worker) {
                return false;
            }

            worker.busy = true;

            Promise.resolve(task())
                .finally(() => {
                    worker.busy = false;
                    worker.processed++;
                });

            return true;
        }
    };
}

const pool = createWorkerPool(4);

async function orchestrate(input) {
    const chunks = [];

    for (let i = 0; i < input.length; i += 10) {
        chunks.push(input.slice(i, i + 10));
    }

    const results = [];

    for (const chunk of chunks) {
        const processed = await batchProcess(chunk);
        results.push(...processed);
    }

    Logger.info("orchestration complete", {
        total: input.length,
        resultSize: results.length
    });

    return results;
}

(async () => {
    const dataset = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        payload: {
            value: i * 2,
            nested: { flag: i % 2 === 0 }
        }
    }));

    const output = await orchestrate(dataset);

    console.log({
        outputSize: output.length,
        metrics: globalState.metrics,
        cacheSize: cache.store.size
    });
})();
const state = {
    cache: new Map(),
    metrics: {
        reads: 0,
        writes: 0,
        misses: 0
    },
    queues: new Map(),
    listeners: new Set()
};

class EventBus {
    constructor() {
        this.handlers = new Map();
    }

    subscribe(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }

        this.handlers.get(event).add(handler);

        return () => {
            this.handlers.get(event)?.delete(handler);
        };
    }

    publish(event, payload) {
        const handlers = this.handlers.get(event);

        if (!handlers) {
            return;
        }

        for (const handler of handlers) {
            try {
                handler(payload);
            } catch {}
        }
    }
}

class MemoryStore {
    constructor(limit = 1000) {
        this.limit = limit;
        this.store = new Map();
    }

    get(key) {
        state.metrics.reads++;

        if (!this.store.has(key)) {
            state.metrics.misses++;
            return null;
        }

        const value = this.store.get(key);

        this.store.delete(key);
        this.store.set(key, value);

        return value;
    }

    set(key, value) {
        state.metrics.writes++;

        if (this.store.has(key)) {
            this.store.delete(key);
        }

        this.store.set(key, value);

        if (this.store.size > this.limit) {
            const oldest = this.store.keys().next().value;
            this.store.delete(oldest);
        }
    }

    delete(key) {
        return this.store.delete(key);
    }

    clear() {
        this.store.clear();
    }
}

class Scheduler {
    constructor(concurrency = 4) {
        this.concurrency = concurrency;
        this.running = 0;
        this.queue = [];
    }

    enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                task,
                resolve,
                reject
            });

            this.process();
        });
    }

    async process() {
        while (
            this.running < this.concurrency &&
            this.queue.length > 0
        ) {
            const item = this.queue.shift();

            this.running++;

            Promise.resolve()
                .then(item.task)
                .then(item.resolve)
                .catch(item.reject)
                .finally(() => {
                    this.running--;
                    queueMicrotask(() => this.process());
                });
        }
    }
}

function hash(input) {
    let h = 2166136261;

    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h +=
            (h << 1) +
            (h << 4) +
            (h << 7) +
            (h << 8) +
            (h << 24);
    }

    return (h >>> 0).toString(16);
}

function deepClone(value) {
    if (value === null || typeof value !== "object") {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(deepClone);
    }

    const result = {};

    for (const [key, val] of Object.entries(value)) {
        result[key] = deepClone(val);
    }

    return result;
}

function memoize(fn, resolver = (...args) => JSON.stringify(args)) {
    const cache = new Map();

    return (...args) => {
        const key = resolver(...args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn(...args);

        cache.set(key, result);

        return result;
    };
}

const bus = new EventBus();
const store = new MemoryStore(5000);
const scheduler = new Scheduler(8);

const compute = memoize((input) => {
    let result = 0;

    for (let i = 0; i < 100000; i++) {
        result += Math.sqrt(i + input);
    }

    return result;
});

async function pipeline(records) {
    const output = [];

    await Promise.all(
        records.map(record =>
            scheduler.enqueue(async () => {
                const key = hash(JSON.stringify(record));

                let cached = store.get(key);

                if (!cached) {
                    cached = {
                        id: key,
                        timestamp: Date.now(),
                        value: compute(record.index || 0)
                    };

                    store.set(key, cached);
                }

                output.push(cached);

                bus.publish("processed", cached);
            })
        )
    );

    return output;
}

bus.subscribe("processed", payload => {
    state.cache.set(payload.id, payload);
});

(async () => {
    const data = Array.from(
        { length: 100 },
        (_, index) => ({
            index,
            active: index % 2 === 0
        })
    );

    const result = await pipeline(data);

    console.log({
        processed: result.length,
        cacheEntries: state.cache.size,
        metrics: state.metrics
    });
})();
