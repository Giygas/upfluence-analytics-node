export const DIMENSIONS = [
    "likes",
    "comments",
    "favorites",
    "retweets",
] as const;
export const KNOWN_TYPES = [
    "pin",
    "instagram_media",
    "youtube_video",
    "article",
    "tweet",
    "facebook_status",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];
export type KnownType = (typeof KNOWN_TYPES)[number];

export type PostData = {
    timestamp: number;
    likes?: number;
    comments?: number;
    retweets?: number;
    favorites?: number;
};

type AnalyticsBase = {
    total_posts: number;
    minimum_timestamp: number;
    maximum_timestamp: number;
};

export type AnalyticsResponse<D extends Dimension> = AnalyticsBase & {
    [K in `avg_${D}`]: number;
};
