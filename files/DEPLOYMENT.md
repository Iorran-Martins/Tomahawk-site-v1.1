# Integração segura da seletiva

O formulário usa uma rota de servidor para enviar a inscrição ao Google Forms e ao FormSubmit. A rota só confirma a inscrição quando o Google Forms aceita a resposta e o FormSubmit aceita o aviso por e-mail.

Antes de publicar, no projeto Vercel que hospeda `tomahawk-three.vercel.app`:

1. Crie uma loja **Vercel Blob privada** e conecte-a ao projeto. A conexão cria `BLOB_READ_WRITE_TOKEN` para as funções.
2. Mantenha o acesso ao projeto e à loja apenas para `iorram.rodrigues@hotmail.com`.
3. Crie `CRON_SECRET` com um valor aleatório forte e mantenha-o como variável sensível.
4. Defina `SITE_ORIGIN=https://tomahawk-three.vercel.app` e `TRYOUT_ENABLED=true`.
5. Publique o conteúdo desta pasta. O agendamento diário remove registros privados de recuperação ao completar 30 dias.

Enquanto `TRYOUT_ENABLED` não estiver definido como `true`, a rota bloqueia novas inscrições. Isso evita que dados sejam enviados sem a cópia privada de recuperação estar disponível.

O registro privado contém somente nome, e-mail, telefone, protocolo, data e o estado dos dois envios. CPF, RG, endereço e informações médicas seguem para a planilha e para a cópia no e-mail da equipe, conforme o aviso apresentado no formulário. Proteja a caixa `flagtomahawk@gmail.com` e elimine as cópias de e-mail quando não forem mais necessárias à seletiva.
