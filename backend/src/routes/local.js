import { Hono } from "hono";
import { getEvents, addEvent, deleteEvent } from "../controllers/eventController.js";
import { getPlaces, addPlace, deletePlace } from "../controllers/placeController.js";

const routes = new Hono();

// Events
routes.get("/local-agenda", getEvents);
routes.post("/local-agenda", addEvent);
routes.delete("/local-agenda/:id", deleteEvent);

// Places
routes.get("/local-guide", getPlaces);
routes.post("/local-guide", addPlace);
routes.delete("/local-guide/:id", deletePlace);

export default routes;
