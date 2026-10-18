import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@sellora/ui/components/sonner";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/lib/auth";
import { AdminPage } from "@/pages/admin";
import { CajaPage } from "@/pages/caja";
import { CardPage } from "@/pages/card";
import { HomePage } from "@/pages/home";
import { LocationsPage } from "@/pages/locations";
import { LoginPage, RegisterPage } from "@/pages/auth";
import { MessagesPage } from "@/pages/messages";
import { SharePage } from "@/pages/share";
import { TeamPage } from "@/pages/team";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
});

// Hash router: en Capacitor la app se sirve desde archivos locales, sin servidor que reescriba rutas.
const router = createHashRouter([
  { path: "/entrar", element: <LoginPage /> },
  { path: "/registro", element: <RegisterPage /> },
  { path: "/admin", element: <AdminPage /> },
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "tarjeta", element: <CardPage /> },
      { path: "mensajes", element: <MessagesPage /> },
      { path: "locales", element: <LocationsPage /> },
      { path: "compartir", element: <SharePage /> },
      { path: "caja", element: <CajaPage /> },
      { path: "equipo", element: <TeamPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
);
