proxy.js - Ele roda antes da página e pode redirecionar. Assim, quem não está logado nunca chega a ver a tela, ele garante que o token existe, tem assinatura válida e não expirou. Ele não consulta o banco, então não sabe se o usuário ainda existe. Isso é coberto no próximo item.

(app) - É um grupo de rotas