import type { Dimension, PostData } from "./types";

export class Aggregator {
    private total = 0;
    private minTimestamp = Number.MAX_SAFE_INTEGER;
    private maxTimestamp = 0;
    private sum = 0;
    private dimension: Dimension;

    constructor(dimension: Dimension) {
        this.dimension = dimension;
    }

    add(post: PostData) {
        this.total++;
        this.sum += post[this.dimension] ?? 0;
        this.minTimestamp = Math.min(this.minTimestamp, post.timestamp);
        this.maxTimestamp = Math.max(this.maxTimestamp, post.timestamp);
    }

    toJSON() {
        return {
            total_posts: this.total,
            minimum_timestamp: this.minTimestamp,
            maximum_timestamp: this.maxTimestamp,
            [`avg_${this.dimension}`]:
                this.total > 0 ? Math.round(this.sum / this.total) : 0,
        };
    }
}
