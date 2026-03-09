import Koa from "Koa";
import ms, { type StringValue } from "ms";
import type { Dimension, Post } from "./types";
import { DIMENSIONS } from "./types";
import { PostBus } from "./post-bus";

const app = new Koa();
const bus = new PostBus();

// ╭─────────────────────────────────────────────────────────╮
// │ MAIN                                                    │
// ╰─────────────────────────────────────────────────────────╯
app.use(async (ctx) => {
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

    // Check for dimension and duration query
    if (!ctx.query.dimension || !ctx.query.duration) {
        ctx.status = 400;
        ctx.body = "Both dimension and duration query params are required";
        return;
    }

    const { duration, dimension } = ctx.query;

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

    ctx.body = "End of the line";

    // If all is good, add as subscriber
});

app.listen(3000);
