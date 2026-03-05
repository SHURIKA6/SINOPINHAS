import type { Env } from '../types';

export const sendToDiscord = async (content: string, env: Env & { DISCORD_WEBHOOK_URL?: string }): Promise<void> => {
    const webhookUrl = env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content })
        });
    } catch (err) {
        console.error("Failed to send to Discord:", err);
    }
};
