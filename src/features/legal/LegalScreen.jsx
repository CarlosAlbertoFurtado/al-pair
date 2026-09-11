import { ChevronLeft, FileText, Lock, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const pages = {
  terms: {
    title: 'Termos de uso',
    icon: FileText,
    sections: [
      ['Uso da comunidade', 'O AuPairConnect é uma comunidade de apoio, troca de experiências e conexão entre pessoas interessadas no universo au pair. Não somos agência de intercâmbio, consultoria jurídica, imigração ou empregadora.'],
      ['Conta e responsabilidade', 'Você deve usar dados verdadeiros, manter sua senha protegida e não se passar por outra pessoa. Conteúdos publicados por usuários são responsabilidade de quem publica.'],
      ['Segurança', 'Não publique documentos pessoais, passaporte, visto, endereço completo, dados bancários ou informações sensíveis em posts, comentários ou chat.'],
      ['Conteúdo proibido', 'Não é permitido assédio, ameaça, discriminação, golpe, spam, nudez, exploração, incentivo a práticas ilegais ou exposição de dados de terceiros.'],
      ['Ações da plataforma', 'Podemos remover conteúdo, limitar recursos ou bloquear contas quando houver risco à comunidade, violação das regras ou solicitação legal válida.'],
    ],
  },
  privacy: {
    title: 'Política de privacidade',
    icon: Lock,
    sections: [
      ['Dados coletados', 'Coletamos dados de cadastro, perfil, publicações, mensagens, denúncias, bloqueios, notificações e informações técnicas necessárias para manter o app funcionando.'],
      ['Uso dos dados', 'Usamos dados para autenticação, exibição de perfil, feed, busca, chat, segurança, prevenção de abuso e melhoria do produto.'],
      ['Fotos e mídia', 'Fotos de perfil e posts podem ser processadas para validação de formato, tamanho, segurança e armazenamento. Evite enviar imagens com documentos ou dados sensíveis.'],
      ['Compartilhamento', 'Não vendemos dados pessoais. Podemos compartilhar dados com provedores técnicos essenciais, como hospedagem, banco de dados, armazenamento de mídia e e-mail transacional.'],
      ['Direitos do usuário', 'Você pode solicitar acesso, correção ou exclusão dos seus dados pelo canal de suporte informado pela equipe do app.'],
    ],
  },
  community: {
    title: 'Regras da comunidade',
    icon: ShieldCheck,
    sections: [
      ['Respeito primeiro', 'Trate outras pessoas com respeito. Divergências são aceitáveis; ataques pessoais, humilhação e perseguição não são.'],
      ['Proteja dados pessoais', 'Não peça nem publique passaporte, visto, CPF, endereço, telefone privado, dados bancários ou documentos de outra pessoa.'],
      ['Denuncie riscos', 'Use denúncia e bloqueio quando encontrar assédio, golpe, perfil falso, pedido suspeito de dinheiro ou conteúdo perigoso.'],
      ['Sem promessas enganosas', 'Não prometa vaga, visto, pagamento, garantia de aprovação, consultoria oficial ou vínculo com agência sem autorização clara.'],
      ['Comunidade beta', 'A plataforma ainda está em beta. Recursos podem mudar, e denúncias serão usadas para melhorar segurança e qualidade da comunidade.'],
    ],
  },
};

export default function LegalScreen() {
  const { page } = useParams();
  const content = pages[page] || pages.terms;
  const Icon = content.icon;

  return (
    <div className="relative z-10 w-full max-w-[430px] min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <Link to="/login" className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100">
            <ChevronLeft size={24} />
          </Link>
          <div className="flex items-center gap-2 text-slate-800 min-w-0">
            <Icon size={20} />
            <h1 className="text-lg font-bold truncate">{content.title}</h1>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 space-y-5 overflow-y-auto">
        {content.sections.map(([title, body]) => (
          <section key={title}>
            <h2 className="text-sm font-black text-slate-900 mb-1">{title}</h2>
            <p className="text-sm leading-relaxed text-slate-600">{body}</p>
          </section>
        ))}

        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs leading-relaxed text-slate-400">
            Versão beta. Este texto é uma base operacional inicial e deve ser revisado por assessoria jurídica antes de lançamento público amplo.
          </p>
        </div>
      </main>
    </div>
  );
}
