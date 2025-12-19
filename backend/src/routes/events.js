import { Hono } from "hono";
import { getEvents, addEvent, deleteEvent } from "../controllers/eventController.js";

const routes = new Hono();

routes.get("/events", getEvents);
routes.post("/events", addEvent);
routes.delete("/events/:id", deleteEvent);

export default routes;
