# TwentyCRMIOSEI — self-hosting

Este fork compila o Twenty a partir deste repositório e publica a imagem `ghcr.io/dimitrimuniz-png/twentycrmiosei`. Os limites comerciais continuam fechados: a chave enterprise, o teto de workspaces, o teto de assentos de provedor de IA e o gate de AWS SES não foram alterados. SSO, regras de linha, auditoria e validação são módulos próprios e não dependem dessa chave.

## 1. Pré-requisitos

- Docker e Docker Compose v2
- Portas 3000 (app), 5432 (Postgres, só na rede interna) e 6379 (Redis, só na rede interna)

## 2. Configurar o ambiente

Na raiz do repositório:

```bash
cp packages/twenty-docker/.env.example packages/twenty-docker/.env
```

Edite `packages/twenty-docker/.env`. O mínimo para subir:

```bash
TAG=local
SERVER_URL=http://localhost:3000
PG_DATABASE_PASSWORD=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
```

`SERVER_URL` é a URL pública que o navegador e o IdP usam. Em produção use `https://crm.seudominio`. `ENCRYPTION_KEY` cifra segredos gravados (incluindo o certificado SAML e o client secret OIDC). Sem ela o servidor recusa subir em produção.

Variáveis que o Compose já encaminha quando existem no `.env`:

| Variável | Função |
| --- | --- |
| `PG_DATABASE_USER` / `PG_DATABASE_PASSWORD` / `PG_DATABASE_NAME` | Postgres do Compose (`postgres` / senha / `default`) |
| `REDIS_URL` | Padrão `redis://redis:6379` |
| `STORAGE_TYPE` | `local` no exemplo. Para S3: `STORAGE_S3_REGION`, `STORAGE_S3_NAME`, `STORAGE_S3_ENDPOINT`, `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY` |
| `APP_SECRET` | Só instâncias antigas, anteriores a `ENCRYPTION_KEY` |
| `APP_VERSION` | Rótulo da imagem local. Padrão `local` |

## 3. Construir e subir a imagem deste fork

O Compose em `packages/twenty-docker/docker-compose.yml` constrói `packages/twenty-docker/twenty/Dockerfile` (alvo `twenty`) e marca a imagem como `ghcr.io/dimitrimuniz-png/twentycrmiosei:${TAG}`. Ele não puxa `twentycrm/twenty`.

```bash
cd packages/twenty-docker
docker compose --env-file .env up --build -d
```

A primeira construção instala dependências e compila server e front dentro da imagem. Quando `http://localhost:3000/healthz` responder, abra `http://localhost:3000` e crie o workspace.

Para usar uma imagem já publicada no GHCR, em vez de construir localmente:

```bash
docker login ghcr.io
TAG=latest docker compose --env-file .env pull
TAG=latest docker compose --env-file .env up -d
```

A imagem no GHCR é multi-arch (`linux/amd64` e `linux/arm64`). Em um Mac Apple Silicon o Docker puxa a variante `arm64` e o processo roda nativo, sem Rosetta.

O workflow `.github/workflows/publish-image.yaml` publica essa imagem em push para `main`, para a branch deste trabalho, em tags `v*` e em execução manual. O pacote precisa estar com visibilidade que a sua conta consiga puxar.

Podman usa o mesmo Dockerfile em `packages/twenty-docker/podman/podman-compose.yml`.

## 4. SSO (SAML e OIDC)

SSO é configurado por workspace, em **Configurações → Segurança → SSO**, depois que o servidor está no ar. Não há variável de ambiente de IdP: cada provedor é um registro do workspace.

1. Confirme que `SERVER_URL` é exatamente a origem que o IdP vai chamar. URLs de callback são montadas a partir dela.
2. Crie o provedor no IdP (Keycloak, Authentik, Google Workspace, Entra ID) apontando para essa origem.
3. Na tela de SSO do Twenty, escolha SAML ou OIDC e grave os dados do IdP.
4. Ative o provedor. O login passa a oferecer esse IdP.

SAML pede o certificado X.509 do IdP, a URL de entrada (SSO URL) e o identificador (entity ID / issuer). OIDC pede issuer, client id e client secret. O segredo fica cifrado com `ENCRYPTION_KEY`.

Um teste de integração contra um Keycloak em container ainda não faz parte deste repositório. Para um ensaio manual, suba o Keycloak na mesma rede Docker, crie um realm, um client SAML e um client OIDC com redirect para `${SERVER_URL}`, e cadastre os dois na tela de SSO. O login por e-mail continua disponível.

## 5. Produção na AWS

O compose de produção, o env de exemplo e o script da EC2 estão descritos em `DEPLOY_AWS_HANDOFF.md`. O login Google dos domínios `iosei.co`, `mstecnologia.med.br` e `i-rad.co` está em `docs/SSO_GOOGLE_PT.md`. A restrição é a variável `SSO_ALLOWED_EMAIL_DOMAINS`. Domínio aprovado do workspace não bloqueia e-mail de fora.

## 6. O que esta imagem não liga

Sem chave enterprise válida o servidor continua recusando workspaces acima do limite, assentos extras de provedor de IA customizado e o envio por AWS SES. Isso é intencional.
