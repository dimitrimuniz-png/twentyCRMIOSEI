# Google SSO — iosei.co, mstecnologia.med.br e i-rad.co

Os três domínios vêm de dois Google Workspaces: `iosei.co` e `mstecnologia.med.br` no mesmo Workspace, `i-rad.co` em outro. Um app OAuth **Internal** só autentica o Workspace dono do projeto. O consent screen deste client precisa ser **External**. Quem limita o login aos três domínios é o servidor, não o Google.

Não defina `ENTERPRISE_KEY`. O módulo de SSO deste fork não depende dela.

## O que não restringe o login

`approvedAccessDomain` (Configurações → Segurança → domínios aprovados) não é uma allowlist. Com `IS_EMAIL_VERIFICATION_REQUIRED=true`, um domínio validado deixa um e-mail daquele domínio entrar no workspace sem convite. Isso amplia o acesso. O callback de SSO não consulta essa tabela: `SsoAuthController.finishSsoSignIn` chamava `signInUp` com o e-mail que o IdP devolveu.

O provedor OIDC (`core."ssoIdentityProvider"`) também não tem coluna de domínios. Issuer, client id e client secret não filtram o e-mail.

## O que restringe

`SSO_ALLOWED_EMAIL_DOMAINS` é uma lista separada por vírgula, só por variável de ambiente (`isEnvOnly`: o painel admin não altera). Vazia, o servidor aceita qualquer domínio — é o comportamento de desenvolvimento. Em produção o valor é exatamente:

```text
iosei.co,mstecnologia.med.br,i-rad.co
```

A comparação é o domínio inteiro depois do `@`, em minúsculas. `ana@iosei.co` passa. `ana@mail.iosei.co`, `ana@notiosei.co` e `ana@gmail.com` não passam.

O servidor recusa o e-mail, com `FORBIDDEN_EXCEPTION` e a mensagem "This email domain is not allowed to sign in.", nestes pontos:

- callback SSO (`/auth/oidc/callback/:id` e `/auth/saml/callback/:id`), antes de criar usuário ou sessão
- cadastro (`signUp` e `signUpInWorkspace`, inclusive o primeiro workspace)
- login com senha
- login Google/Microsoft embutido (`AUTH_GOOGLE_*` / `AUTH_MICROSOFT_*`), se algum dia for ligado

No callback OIDC, um claim `email_verified` explícito `false` também é recusado. Claim ausente não bloqueia (há IdPs que não o mandam). O Google manda `true` para conta Workspace.

O `deploy.sh` aborta se a lista não for exatamente esses três domínios.

## Um client OAuth, não dois

Um client Web **External** em qualquer um dos dois Workspaces autentica os dois, porque o issuer do Google é sempre `https://accounts.google.com`. O `hd` da autorização aceita um domínio só; este servidor não envia `hd`. A allowlist faz o corte.

Dois clients (um por Workspace), cada um cadastrado como um provedor OIDC, também funcionam. Cada um ganha o próprio callback. A allowlist continua valendo. Não é necessário.

Escopos do client: `openid`, `email`, `profile` apenas. Com esses escopos o Google em geral não exige a verificação do app. Não peça Gmail nem Calendar neste client: isso muda a revisão e não é o login.

Enquanto o app estiver em **Testing**, o Google só deixa entrar os test users (e há um teto). Publique o consent screen (**In production**) antes de chamar os outros domínios. Testing não substitui a allowlist: um test user `@gmail.com` ainda é recusado pelo servidor.

## URL de callback

O servidor monta a redirect URI em `SsoService.buildCallbackUrl`:

```text
SERVER_URL sem a barra final
  + /auth/oidc/callback/
  + id do provedor (UUID gerado ao salvar)
```

`SERVER_URL` em produção é `https://CRM_DOMAIN`, sem porta e sem path. Exemplo, com o id que o Twenty gerar:

```text
https://crm.iosei.co/auth/oidc/callback/3f1c2a7e-1111-4111-8111-111111111111
```

Essa string, sem barra no fim, é o **Authorized redirect URI** do client Google. A URL de login (`/auth/oidc/login/<id>`) não é o redirect URI. O botão de SSO do Twenty manda o browser para o login; o Google devolve o código no callback.

O id não existe antes de salvar o provedor. A tela **Configurações → Segurança → SSO** lista cada provedor OIDC com essa URL pronta. Se precisar confirmar no banco:

```sql
SELECT id, name, type, status, issuer
FROM core."ssoIdentityProvider";
```

Authorized JavaScript origins: `https://crm.iosei.co` (o `SERVER_URL`, sem path).

## Ordem

1. Suba o CRM com SMTP funcionando (`EMAIL_DRIVER=smtp`). O primeiro usuário é senha, não SSO: o provedor só pode ser criado dentro do workspace.
2. Crie a conta com um e-mail dos três domínios. A verificação chega pelo SMTP. Sem isso, `IS_EMAIL_VERIFICATION_REQUIRED=true` impede o login seguinte.
3. No Google Cloud Console, consent screen **External**, escopos `openid` `email` `profile`, app publicado. Crie um OAuth client ID do tipo Web. Pode deixar o redirect vazio por um minuto.
4. No Twenty: **Configurações → Segurança → SSO → Add provider**. Protocolo **OIDC**. Nome `Google`. Issuer `https://accounts.google.com`. Client ID e client secret do passo anterior. Salve.
5. Copie a URL de callback que a lista passou a mostrar e cole em **Authorized redirect URIs**. Salve o client no Google.
6. Saia e entre de novo. O login oferece o provedor. Prove com um e-mail de cada domínio e com um `@gmail.com`, que deve ser recusado.
7. O client secret fica cifrado com `ENCRYPTION_KEY`. Perder a chave impede ler o segredo. Na rotação, a chave antiga vai para `FALLBACK_ENCRYPTION_KEY`.

O status do provedor nasce `Active`. Desligar o provedor na linha dele não desliga a allowlist: senha de outro domínio continua recusada.

Domínio aprovado, se quiserem que qualquer pessoa de `iosei.co` entre sem convite, é um passo extra e opcional nessa mesma área de Segurança. Não substitui `SSO_ALLOWED_EMAIL_DOMAINS`.
