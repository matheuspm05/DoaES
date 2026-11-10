import { useRoutes } from "react-router-dom";
import { publicRoutes } from "./publicRoutes";
import { browseRoutes } from "./browseRoutes";
import { donorRoutes } from "./donorRoutes";
import { churchRoutes } from "./churchRoutes";

export default function AppRoutes() {
  return useRoutes([
    ...publicRoutes,
    ...browseRoutes,
    ...donorRoutes,
    ...churchRoutes,
  ]);
}
