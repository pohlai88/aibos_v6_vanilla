import { z } from "zod";

const Env = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    NEXT_PUBLIC_API_URL: z.string().url()
});

export const env = Env.parse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
});

// Usage:
// fetch(`${env.NEXT_PUBLIC_API_URL}/health`)
// If parsing fails, the app should crash early with a helpful message.
