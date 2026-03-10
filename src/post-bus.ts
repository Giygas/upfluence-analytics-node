import EventEmitter from "events";
import { KNOWN_TYPES, type KnownType, type PostData } from "./types";

const RETRY_TIMEOUT = 2000;

function parsePost(postString: string): PostData | null {
    const post = JSON.parse(postString) as Record<
        string,
        Record<string, unknown>
    >;

    const platform = Object.keys(post)[0];

    if (!platform) return null;
    if (!KNOWN_TYPES.includes(platform as KnownType)) return null;

    const raw = post[platform];

    if (!raw) return null;

    const data: PostData = {
        timestamp: raw.timestamp as number,
        likes: raw.likes as number | undefined,
        comments: raw.comments as number | undefined,
        retweets: raw.retweets as number | undefined,
        favorites: raw.favorites as number | undefined,
    };

    console.log("data: ", data);

    return data;
}

export class PostBus extends EventEmitter {
    public isConnected = false;

    constructor() {
        super();
        this.connect();
    }

    private async connect() {
        try {
            console.log("Connecting to stream...");
            const response = await fetch("https://stream.upfluence.co/stream");

            if (!response.body) {
                setTimeout(() => {
                    this.connect();
                }, RETRY_TIMEOUT);
                return;
            }

            this.isConnected = true;
            console.log("Stream connected");

            const decoder = new TextDecoder();

            for await (const chunk of response.body) {
                const line = decoder.decode(chunk);
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
