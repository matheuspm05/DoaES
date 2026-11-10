import { Outlet } from "react-router-dom";
import { useDemo } from "../contexts/demo";
import { AppLayout } from "./AppLayout";
import { PublicLayout } from "./PublicLayout";

export function BrowseLayout() {
  const { mode } = useDemo();
  return mode === "doador" ? (
    <AppLayout />
  ) : (
    <PublicLayout>
      <div className="container browse-public">
        <Outlet />
      </div>
    </PublicLayout>
  );
}
