# StudyX - Painel de Organização Acadêmica

O **StudyX** é uma plataforma centralizada desenvolvida para combater a **fragmentação digital** e a **invisibilidade do esforço acadêmico** no ambiente universitário. O sistema permite que os estudantes gerenciem suas disciplinas, organizem tarefas através de um fluxo visual e mantenham materiais de estudo em um único lugar.

---

##  Funcionalidades Principais

*   **Gestão de Disciplinas:** Permite o cadastro de matérias com **personalização de cores** para etiquetas e identificação do professor responsável.
*   **Quadro Kanban Interativo:** Sistema dinâmico de *Drag-and-Drop* (arrastar e soltar) para gerenciar o progresso das atividades entre os estados: **A Fazer**, **Fazendo / Estudando** e **Concluído**.
*   **Agenda Inteligente:** Diferenciação visual entre tarefas comuns e provas. As avaliações recebem automaticamente um selo de prioridade alta (**badge-prova**) e alertas em vermelho.
*   **Biblioteca Digital:** Sistema de **upload e armazenamento** de materiais de apoio (PDFs e imagens) vinculados diretamente às disciplinas cadastradas.
*   **Priorização Visual:** Uso de cores (Vermelho, Amarelo e Verde) para indicar níveis de urgência nas tarefas diretamente no quadro.
*   **Segurança:** Controle de acesso e proteção de dados através de autenticação via **Token (JWT)**.

##  Tecnologias Utilizadas

A estrutura técnica do projeto baseia-se em:
*   **Frontend:** HTML5, CSS3 (utilizando **Grid e Flexbox**) e **Vanilla JavaScript** para uma manipulação dinâmica do DOM.
*   **Backend:** Integração com uma **API REST**, comunicando-se através de endpoints como `/materias`, `/tarefas` e `/materiais`.
*   **Persistência:** Gerenciamento de dados e arquivos através de chamadas assíncronas ao servidor.

##  Como Instalar e Executar

1.  **Clonar o Repositório:** Baixe o código para sua máquina local.
2.  **Configurar o Backend:** Certifique-se de que o servidor da API esteja rodando nos endpoints configurados no JavaScript.
3.  **Acessar o Frontend:** Abra o arquivo `index.html` em seu navegador. Recomenda-se o uso da extensão **Live Server** para garantir que as funcionalidades de rede e segurança operem corretamente.

##  Equipe do Projeto

Este projeto foi desenvolvido pelas autoras:
*   **Emanuela**
*   **Daiana**
*   **Isadora**


