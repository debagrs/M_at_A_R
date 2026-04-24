# M_at_A_R — Tríptico Ambiental

M_at_A_R é uma série tríptica ambiental que investiga a interdependência entre mar, mata e ar através de dados ambientais em tempo real. Um projeto de Débora Aita Gasparetto.

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- P5.js
- Framer Motion
- Lucide React
- Supabase

## Como Rodar no GitHub Codespace

1. Clique em **"Code"** → **"Codespaces"** → **"Create codespace on main"**.
2. Espere o Codespace ser criado (ele vai instalar dependências automaticamente).
3. No terminal, execute:
   ```bash
   npm run dev
   ```
4. Clique no link que aparecerá ou acesse `http://localhost:8080` no navegador.

## Como Rodar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/debagrs/M_at_A_R.git
   cd M_at_A_R
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Abra o navegador em `http://localhost:8080`.

## Estrutura do Projeto

- `/src/pages`: Contém as obras individuais (Mar, Mata, Ar) e a Home.
- `/src/components`: Componentes reutilizáveis e sistemas de visualização (Canvas).
- `/src/lib`: Lógica de processamento de dados ambientais.
- `/src/hooks`: Hooks customizados para áudio e estado.
