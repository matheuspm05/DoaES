import {
  LayoutDashboard,
  Church,
  Heart,
  Megaphone,
  PackagePlus,
  History,
  UserRound,
  Inbox,
  CalendarDays,
  Settings2,
} from "lucide-react";

export const donorLinks = [
  ["/doador", "Visão geral", LayoutDashboard],
  ["/igrejas", "Explorar igrejas", Church],
  ["/campanhas", "Campanhas", Megaphone],
  ["/doador/nova-doacao", "Nova doação", PackagePlus],
  ["/doador/acompanhar", "Acompanhar", Heart],
  ["/doador/historico", "Histórico", History],
  ["/doador/perfil", "Meu perfil", UserRound],
];
export const churchLinks = [
  ["/igreja", "Visão geral", LayoutDashboard],
  ["/igreja/solicitacoes", "Solicitações", Inbox],
  ["/igreja/campanhas", "Campanhas", Megaphone],
  ["/igreja/agendamentos", "Agendamentos", CalendarDays],
  ["/igreja/configuracoes", "Perfil e coleta", Settings2],
];
