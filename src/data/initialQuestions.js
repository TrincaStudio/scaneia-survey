const INITIAL_QUESTIONS = [
	{
		id: "porte",
		step: 1,
		label: "PORTE DA EMPRESA",
		question: "Qual é o porte do seu negócio hoje?",
		options: [
			{ value: "mei", label: "MEI / Autônomo", sub: "Trabalho sozinho ou com 1-2 pessoas" },
			{ value: "micro", label: "Micro empresa", sub: "Até 9 funcionários" },
			{ value: "pequena", label: "Pequena empresa", sub: "10 a 49 funcionários" },
			{ value: "media", label: "Média empresa", sub: "50 a 499 funcionários" },
		],
	},
	{
		id: "setor",
		step: 2,
		label: "SETOR",
		question: "Em qual setor você atua?",
		options: [
			{ value: "servicos", label: "Serviços / Consultoria" },
			{ value: "varejo", label: "Varejo / Comércio" },
			{ value: "industria", label: "Indústria / Produção" },
			{ value: "tech", label: "Tecnologia / SaaS" },
			{ value: "saude", label: "Saúde / Bem-estar" },
			{ value: "outro", label: "Outro" },
		],
	},
	{
		id: "dor_principal",
		step: 3,
		label: "O MAIOR TRAVÃO",
		question: "O que está travando seu negócio agora?",
		options: [
			{ value: "vendas", label: "Vendas e geração de receita", sub: "Difícil fechar novos clientes ou aumentar ticket" },
			{ value: "operacao", label: "Operação e processos", sub: "Retrabalho, gargalos, falta de padronização" },
			{ value: "pessoas", label: "Time e gestão de pessoas", sub: "Contratação, retenção, produtividade" },
			{ value: "financeiro", label: "Financeiro e fluxo de caixa", sub: "Margem, inadimplência, previsibilidade" },
			{ value: "marketing", label: "Marketing e posicionamento", sub: "Marca fraca, poucos leads, sem diferencial claro" },
			{ value: "estrategia", label: "Estratégia e direção", sub: "Não saber o próximo passo ou onde focar" },
		],
	},
];

export default INITIAL_QUESTIONS;
