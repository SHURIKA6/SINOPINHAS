// Buscar todos os usuários (para inbox)
app.get("/api/users/all", async (c) => {
    const env = c.env;

    try {
        const { rows } = await queryDB(
            "SELECT id, username, avatar, bio FROM users ORDER BY username ASC",
            [],
            env
        );
        return c.json(rows);
    } catch (err) {
        console.error("Erro ao listar usuários:", err);
        return c.json({ error: "Erro ao listar usuários" }, 500);
    }
});
