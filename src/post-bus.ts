import EventEmitter from "events";
import type { Post } from "./types";

const RETRY_TIMEOUT = 2000;

function parsePost(postString: string): Post {
    //TODO: implement this
    return { timestamp: "116549845" } as Post;
}

export class PostBus extends EventEmitter {
    public isConnected = false;

    constructor() {
        super();
        this.connect();
    }

    private async connect() {
        try {
            const response = await fetch("https://stream.upfluence.co/stream");

            if (!response.body) {
                setTimeout(() => {
                    this.connect();
                }, RETRY_TIMEOUT);
                return;
            }

            this.isConnected = true;

            for await (const chunk of response.body) {
                const line = chunk.toString();
                if (!line.startsWith("data:")) continue;

                // Remove the data: prefix from the post
                const DATA_PREFIX = "data: ";
                const post = parsePost(line.slice(DATA_PREFIX.length).trim());

                // Broadcast for all subscribers
                if (post) {
                    this.emit("post", post);
                }
            }
        } catch (err) {
            console.error("Stream disconnected, reconnecting in 2s...", err);
        } finally {
            this.isConnected = false;
            setTimeout(() => {
                this.connect();
            }, RETRY_TIMEOUT);
        }
    }
}
