import type { AnalyticsResponse, Dimension, PostData } from "./types";

export class Aggregator<D extends Dimension> {
    private total = 0;
    private minTimestamp = Number.MAX_SAFE_INTEGER;
    private maxTimestamp = 0;
    private sum = 0;
    private dimension: D;

    constructor(dimension: D) {
        this.dimension = dimension;
    }

    add(post: PostData) {
        this.total++;
        this.sum += post[this.dimension] ?? 0;
        this.minTimestamp = Math.min(this.minTimestamp, post.timestamp);
        this.maxTimestamp = Math.max(this.maxTimestamp, post.timestamp);
    }

    toJSON(): AnalyticsResponse<D> {
        return {
            total_posts: this.total,
            minimum_timestamp: this.total > 0 ? this.minTimestamp : 0, // Guard for no posts
            maximum_timestamp: this.maxTimestamp,
            [`avg_${this.dimension}`]:
                this.total > 0 ? Math.round(this.sum / this.total) : 0,
        } as AnalyticsResponse<D>;
    }
}
