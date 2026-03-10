import Koa from "Koa";
import gracefulShutdown from "http-graceful-shutdown";
import ms, { type StringValue } from "ms";
import type { Dimension, PostData } from "./types";
import { DIMENSIONS } from "./types";
import { PostBus } from "./post-bus";
import { Aggregator } from "./aggregator";

const app = new Koa();
const bus = new PostBus();

let isShuttingDown = false;

// ╭─────────────────────────────────────────────────────────╮
// │ MAIN                                                    │
// ╰─────────────────────────────────────────────────────────╯
app.use(async (ctx) => {
    // No need to do anything if the server is shutting down
    if (isShuttingDown) {
        ctx.status = 503;
        ctx.body = "Server is shutting down";
        return;
    }

    if (ctx.method !== "GET") {
        ctx.status = 405;
        ctx.body = "Method not allowed";
        return;
    }
    if (ctx.path !== "/analysis") {
        ctx.status = 404;
        ctx.body = "Invalid path";
        return;
    }

    const { duration, dimension } = ctx.query;

    // Check for dimension and duration query
    if (!dimension || !duration) {
        ctx.status = 400;
        ctx.body = "Both dimension and duration query params are required";
        return;
    }

    // ╭─────────────────────────────────────────────────────────╮
    // │ DURATION                                                │
    // ╰─────────────────────────────────────────────────────────╯

    // ctx.query.duration can be string | string[], ensure single value
    if (typeof duration !== "string") {
        ctx.status = 400;
        ctx.body = "Duration must be a single value";
        return;
    }
    const durationMS = ms(duration as StringValue);
    if (durationMS === undefined) {
        ctx.status = 400;
        ctx.body = "Invalid duration format. Use: 15m, 2h, 90s, 1.5d, etc.";
        return;
    }

    // ╭─────────────────────────────────────────────────────────╮
    // │ DIMENSIONS                                              │
    // ╰─────────────────────────────────────────────────────────╯
    if (typeof dimension !== "string") {
        ctx.status = 400;
        ctx.body = "Dimension must be a single value";
        return;
    }

    if (!DIMENSIONS.includes(dimension as Dimension)) {
        ctx.status = 400;
        ctx.body = "Dimension should be likes, comments, favorites or retweets";
        return;
    }

    let completedNormally = false;
    const aggregator = new Aggregator(dimension as Dimension);

    await new Promise<void>((resolve) => {
        const handler = (post: PostData) => {
            console.log("Post data:", post);
            aggregator.add(post);
        };

        const shutdownHandler = () => {
            bus.off("post", handler);
            resolve();
        };

        bus.on("post", handler);
        process.once("shutdown", shutdownHandler);

        setTimeout(() => {
            bus.off("post", handler);
            process.off("shutdown", shutdownHandler);
            completedNormally = true;
            resolve();
        }, durationMS);
    });

    // Without this check, a request that completed its full duration would return 503
    // if a shutdown happened to occur during that same window.
    // We only want to return 503 if the shutdown actually interrupted the request.
    if (isShuttingDown && !completedNormally) {
        ctx.status = 503;
        ctx.body = "Server is shutting down";
        return;
    }

    ctx.status = 200;
    ctx.body = aggregator.toJSON();
});

const server = app.listen(8080, () => {
    console.log("Server listening on port 8080");
    bus.connect();
});

process.once("SIGINT", () => {
    isShuttingDown = true;
    process.emit("shutdown");
});

process.once("SIGTERM", () => {
    isShuttingDown = true;
    process.emit("shutdown");
});

gracefulShutdown(server, {
    signals: "SIGINT SIGTERM",
    timeout: 10000,
    onShutdown: async () => {
        bus.disconnect();
    },
    finally: () => {
        console.log("Process exiting");
    },
});
