import { Aggregator } from "./aggregator";
import type { PostBus } from "./post-bus";
import { shutdownBus } from "./shutdown-bus";
import type { AnalyticsResponse, Dimension, PostData } from "./types";

export class AnalyticsService {
    constructor(private bus: PostBus) {}

    async run(
        duration: number,
        dimension: Dimension,
    ): Promise<[AnalyticsResponse<Dimension>, boolean]> {
        let completedNormally = false;

        const aggregator = new Aggregator(dimension);

        await new Promise<void>((resolve) => {
            const handler = (post: PostData) => {
                aggregator.add(post);
            };

            const shutdownHandler = () => {
                this.bus.off("post", handler);
                resolve();
            };

            this.bus.on("post", handler);
            shutdownBus.once("shutdown", shutdownHandler);

            setTimeout(() => {
                this.bus.off("post", handler);
                shutdownBus.off("shutdown", shutdownHandler);
                completedNormally = true;
                resolve();
            }, duration);
        });

        return [aggregator.toJSON(), completedNormally] as const;
    }
}
