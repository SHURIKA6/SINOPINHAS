import { Hono } from "hono";
import { getPlaces, addPlace, deletePlace } from "../controllers/placeController.js";

const routes = new Hono();

routes.get("/places", getPlaces);
routes.post("/places", addPlace);
routes.delete("/places/:id", deletePlace);

export default routes;
