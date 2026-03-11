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
