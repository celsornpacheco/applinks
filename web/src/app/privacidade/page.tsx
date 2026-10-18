import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacidade" };

// Aviso de privacidade para quem usa o sistema (LGPD). Revisar com o jurídico da Inovapet.
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl">Privacidade no Inovapet Manutenção</h1>
      <div className="flex flex-col gap-4 text-base leading-relaxed">
        <p>
          Este sistema é de uso interno da Inovapet Embalagens para controlar a manutenção de máquinas e equipamentos.
        </p>
        <h2 className="text-lg">Que dados guardamos</h2>
        <ul className="list-disc pl-5">
          <li>Nome, e-mail e perfil de acesso de cada usuário.</li>
          <li>O que cada pessoa registra nas ordens de serviço: textos, fotos, leituras, horários e assinatura.</li>
          <li>Registros de acesso necessários para a segurança da conta.</li>
        </ul>
        <h2 className="text-lg">Para que usamos</h2>
        <p>
          Para organizar e comprovar os serviços de manutenção, cumprir prazos e gerar indicadores da operação. Não vendemos
          nem compartilhamos esses dados para outros fins.
        </p>
        <h2 className="text-lg">Quem processa os dados</h2>
        <ul className="list-disc pl-5">
          <li>Supabase (banco de dados, login e armazenamento de arquivos), servidores nos Estados Unidos.</li>
          <li>Vercel (hospedagem do sistema), servidores nos Estados Unidos.</li>
        </ul>
        <h2 className="text-lg">Seus direitos</h2>
        <p>
          Você pode pedir acesso, correção ou exclusão dos seus dados ao administrador do sistema na Inovapet. Ao desligar um
          usuário, a conta é desativada e o histórico das ordens de serviço é mantido como registro da manutenção.
        </p>
      </div>
    </main>
  );
}
