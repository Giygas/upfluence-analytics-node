import EventEmitter from "events";
import { KNOWN_TYPES, type KnownType, type PostData } from "./types";

const RETRY_TIMEOUT = 2000;
const DATA_PREFIX = "data: ";

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

    return data;
}

export class PostBus extends EventEmitter {
    private abortController: AbortController | null = null;
    public isConnected = false;

    constructor() {
        super();
    }

    public async connect() {
        this.abortController = new AbortController();
        try {
            console.log("Connecting to upfluence stream...");
            const response = await fetch("https://stream.upfluence.co/stream", {
                signal: this.abortController.signal,
            });

            if (!response.body) {
                setTimeout(() => this.connect(), RETRY_TIMEOUT);
                return;
            }

            this.isConnected = true;
            console.log("Stream connected");

            const decoder = new TextDecoder();
            for await (const chunk of response.body) {
                const line = decoder.decode(chunk);
                if (!line.startsWith("data:")) continue;

                const post = parsePost(line.slice(DATA_PREFIX.length).trim());
                if (post) this.emit("post", post);
            }
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
                console.log("Stream aborted — shutting down");
                return;
            }
            console.error("Stream disconnected, reconnecting...\n-->", err);
            setTimeout(() => this.connect(), RETRY_TIMEOUT);
        } finally {
            this.isConnected = false;
        }
    }

    public async disconnect() {
        this.abortController?.abort();
    }
}
