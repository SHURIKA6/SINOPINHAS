export const sendToDiscord = async (content, env) => {
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
