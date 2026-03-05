import { Hono } from "hono";
import { getEvents, addEvent, deleteEvent } from "../controllers/eventController";
import { getPlaces, addPlace, deletePlace } from "../controllers/placeController";
import { authMiddleware, requireAdmin } from "../middleware/auth";

const routes = new Hono();

// Seção: Agenda Local (Eventos)
routes.get("/local-agenda", getEvents);
routes.post("/local-agenda", authMiddleware, requireAdmin, addEvent);
routes.delete("/local-agenda/:id", authMiddleware, requireAdmin, deleteEvent);

// Seção: Guia Local (Lugares)
routes.get("/local-guide", getPlaces);
routes.post("/local-guide", authMiddleware, requireAdmin, addPlace);
routes.delete("/local-guide/:id", authMiddleware, requireAdmin, deletePlace);

export default routes;
