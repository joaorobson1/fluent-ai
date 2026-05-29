import { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Fluent AI — Aprenda Inglês com Inteligência Artificial",
  description: "Domine o inglês com microlearning, gamificação e tarefas personalizadas por IA. 5 minutos por dia. Resultados reais.",
};

export default function HomePage() {
  return <LandingPage />;
}
