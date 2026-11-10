import { PublicLayout } from "../layouts/PublicLayout";
import { LandingLayout } from "../layouts/LandingLayout";
import Home from "../pages/public/Home";
import { Login } from "../pages/public/Login";
import { Register } from "../pages/public/Register";
import { Empty, Button } from "../components";

export const publicRoutes = [
  {
    path: "/",
    element: <LandingLayout />,
    children: [{ index: true, element: <Home /> }],
  },
  {
    element: <PublicLayout />,
    children: [
      { path: "entrar", element: <Login /> },
      { path: "cadastro/doador", element: <Register /> },
      { path: "cadastro/igreja", element: <Register churchMode /> },
      {
        path: "*",
        element: (
          <div className="container not-found">
            <Empty
              title="Esse caminho ainda não existe"
              description="Uma boa ação pode começar pela página inicial."
              action={<Button to="/">Voltar ao início</Button>}
            />
          </div>
        ),
      },
    ],
  },
];
