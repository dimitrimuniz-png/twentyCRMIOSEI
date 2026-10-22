# Handoff de produção — AWS sa-east-1

Este arquivo é o contrato com o agente que provisiona a AWS. O aplicativo sobe com `deploy/aws/deploy.sh` em uma EC2 Ubuntu 24.04 ARM. Não há container de Postgres. Redis e o proxy ficam na EC2. A chave enterprise não entra neste ambiente: não crie, não copie e não grave `ENTERPRISE_KEY`.

A imagem é `ghcr.io/dimitrimuniz-png/twentycrmiosei`, multi-arch (`linux/amd64` e `linux/arm64`) desde o merge do PR #2. A EC2 é Graviton, então a tag precisa ter manifest `linux/arm64`. `sha-9140b02` tem as duas arquiteturas, mas não contém `SSO_ALLOWED_EMAIL_DOMAINS`. Use a tag `sha-*` publicada pelo workflow **Publish container image** do commit que inclui este deploy.

SSO do Google está em [`docs/SSO_GOOGLE_PT.md`](docs/SSO_GOOGLE_PT.md).

## O que você devolve

Grave a senha do RDS, `ENCRYPTION_KEY`, `APP_SECRET` e `REDIS_PASSWORD` só em `/opt/twenty/.env.production` (modo `600`). Não as coloque na resposta. Devolva:

| Item | Exemplo |
| --- | --- |
| Endpoint do RDS (hostname) | `twenty.xxxx.sa-east-1.rds.amazonaws.com` |
| Porta | `5432` |
| Nome do banco | `default` |
| Usuário master | `twenty` |
| Elastic IP | `a.b.c.d` |
| `CRM_DOMAIN` | o subdomínio que o dono escolher; exemplo `crm.iosei.co` |
| Bucket S3 | nome global único |
| Instance id | `i-...` |
| Hop limit do IMDS | `2` |
| `PubliclyAccessible` do RDS | `false` |
| Security groups | id do SG da EC2 e id do SG do RDS |

## Custo

Uma VPC default, sem NAT Gateway e sem ALB. O TLS termina no Caddy da EC2. O Elastic IP anexado a uma instância ligada não é cobrado à parte. Não ligue Performance Insights.

| Peça | Escolha |
| --- | --- |
| EC2 | `t4g.large`, Ubuntu 24.04 arm64, disco gp3 criptografado de 30 GiB |
| RDS | PostgreSQL 16, `db.t4g.small`, Single-AZ, gp3 20 GiB, backup 7 dias, criptografia ligada, `PubliclyAccessible=false`, deletion protection ligada. `db.t4g.micro` fica curto para o pool padrão de 10 conexões |
| S3 | um bucket, versionamento ligado, Block Public Access, SSE-S3 |
| Rede | VPC default. A EC2 na subnet pública com o Elastic IP. O RDS no mesmo VPC, sem IP público. Subnet group do RDS com subnets em pelo menos duas AZs (exigência da AWS mesmo em Single-AZ) |

Confira o preço vigente na calculadora. Não abra SES.

## 1. Rede e security groups

Na VPC default, região `sa-east-1`:

1. SG `twenty-ec2`:
   - entrada 80 e 443 de `0.0.0.0/0` e `::/0` (HTTP-01 do Let's Encrypt e HTTPS)
   - sem 3000, sem 5432, sem 6379
   - SSH 22 só se o dono pedir, e só do CIDR dele. O caminho normal é o Session Manager
   - saída liberada (GHCR, Let's Encrypt, RDS, SMTP, Google, S3)
2. SG `twenty-rds`:
   - entrada 5432 somente do SG `twenty-ec2`
   - nada de `0.0.0.0/0`

## 2. IAM da EC2 (sem access key)

Role `twenty-crm-ec2` com trust `ec2.amazonaws.com`, instance profile com o mesmo nome, anexada à instância.

Política gerenciada `AmazonSSMManagedInstanceCore`.

Política inline no bucket, trocando `BUCKET`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": "arn:aws:s3:::BUCKET"
    },
    {
      "Sid": "Objects",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "arn:aws:s3:::BUCKET/*"
    }
  ]
}
```

Não crie `AWS_ACCESS_KEY_ID`. O servidor usa a cadeia padrão do SDK quando `STORAGE_S3_ACCESS_KEY_ID` está vazio. O container só alcança o IMDS se o hop limit for 2 (o padrão 1 para na ponte Docker):

```bash
aws ec2 modify-instance-metadata-options \
  --region sa-east-1 \
  --instance-id i-XXXXXXXX \
  --http-tokens required \
  --http-put-response-hop-limit 2 \
  --http-endpoint enabled
```

Pode passar os mesmos `--metadata-options` no `run-instances`.

## 3. S3

Bucket na `sa-east-1` (em `create-bucket` desta região é obrigatório `LocationConstraint=sa-east-1`).

- Block Public Access nas quatro opções
- versionamento `Enabled`
- criptografia SSE-S3 (`AES256`)
- lifecycle só para abortar multipart incompleto depois de 7 dias. Não expire o objeto atual
- sem policy pública e sem CORS. `STORAGE_S3_PRESIGNED_URL_ENABLED` fica `false`, então o browser não fala com o S3 direto

O driver usa path-style (`forcePathStyle`). Não defina `STORAGE_S3_ENDPOINT`.

## 4. RDS

PostgreSQL 16 (minor atual da região). Banco criado já com o nome `default`. Usuário master `twenty`. Senha `openssl rand -hex 32` (só hex, para caber na URL sem escape).

- `PubliclyAccessible=false`
- Single-AZ
- gp3, 20 GiB, criptografado
- backup retention 7, deletion protection ligada
- janela de backup fora do horário comercial de Brasília
- parameter group com `rds.force_ssl=1`

O entrypoint cria as extensões `uuid-ossp`, `unaccent` e `citext`. O usuário master consegue. Se o init falhar com extension not allow-listed, acrescente essas três em `rds.allowed_extensions` e suba de novo. Não ligue `IS_FDW_ENABLED`.

`PG_DATABASE_URL` fica assim, com a senha hex e o endpoint real:

```text
postgres://twenty:SENHA_HEX@ENDPOINT:5432/default?sslmode=require
```

`PG_SSL_ALLOW_SELF_SIGNED=true` continua obrigatório no `deploy.sh`, mas não desliga a verificação: o `pg` lê o `sslmode=require` da URL e valida o certificado do RDS. O `deploy.sh` baixa o [`global-bundle.pem`](https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem) para `rds-global-bundle.pem` na raiz do repositório, e o Compose o monta no server e no worker com `NODE_EXTRA_CA_CERTS` (Node) e `PGSSLROOTCERT` (`psql` do entrypoint). Resultado: TLS com a CA do RDS verificada nos dois caminhos.

A API do RDS recusa `default` como `--db-name` (palavra reservada). Crie a instância sem `--db-name` e, antes do primeiro `deploy.sh`, crie o banco com `CREATE DATABASE "default";` conectado ao banco `postgres` com o usuário `twenty`.

## 5. EC2

- AMI Canonical Ubuntu 24.04 LTS **arm64** (`ubuntu-noble-24.04-arm64-server`), owner `099720109477`
- tipo `t4g.large`
- subnet pública da VPC default
- SG `twenty-ec2`
- instance profile `twenty-crm-ec2`
- disco raiz gp3 30 GiB criptografado
- Elastic IP alocado e associado. Sem o EIP o Let's Encrypt e o registro A quebram no próximo stop/start
- IMDS hop limit 2, tokens obrigatórios

## 6. DNS

O dono escolhe o subdomínio. Exemplo: `crm.iosei.co`.

Registro **A** de `CRM_DOMAIN` para o Elastic IP. TTL 300. O Caddy só emite o certificado quando esse nome resolve para esta máquina, nas portas 80 e 443. Crie o registro antes de rodar `deploy.sh`.

`SERVER_URL` tem de ser exatamente `https://CRM_DOMAIN`, sem porta, sem barra e sem path. O Compose grava esse valor por cima do arquivo. O `deploy.sh` recusa os dois se divergirem.

## 7. Arquivo de ambiente e o comando

Na instância, como `ubuntu`, com Session Manager ou SSH:

```bash
sudo mkdir -p /opt/twenty
sudo chown ubuntu:ubuntu /opt/twenty
git clone --depth 1 --branch cursor/prod-aws-deploy-3051 \
  git@github.com:dimitrimuniz-png/twentyCRMIOSEI.git /opt/twenty
cd /opt/twenty
cp .env.production.example .env.production
chmod 600 .env.production
```

Se o repositório for privado, use uma deploy key só de leitura. Depois do merge deste PR, clone `main` em vez da branch.

Preencha `.env.production` a partir do exemplo. Gere na própria instância:

```bash
openssl rand -hex 32    # REDIS_PASSWORD e a senha do RDS
openssl rand -base64 32 # ENCRYPTION_KEY
openssl rand -base64 32 # APP_SECRET, outro valor
```

`TAG` é `sha-` mais o sha curto publicado pelo workflow. No commit que o workflow buildou, `git rev-parse --short=7 HEAD` coincide quando não há colisão. Confira a tag no pacote GHCR. Não use `latest` e não use `sha-9140b02` para este deploy.

`EMAIL_SMTP_PASSWORD` é do dono (app password ou senha do relay). O script aborta enquanto o valor contiver `replace_me`. Não invente essa senha.

Pacote GHCR privado: `docker login ghcr.io` com um PAT `read:packages` antes do script. Se o pacote for público, o login não é necessário.

```bash
cd /opt/twenty
./deploy/aws/deploy.sh
```

O script é idempotente. Ele instala Docker e o plugin Compose se faltarem, faz `chmod 600` no env, valida o arquivo, dá pull da tag, sobe a stack e espera `/healthz`.

Critério de sucesso: o `curl` interno em `http://localhost:3000/healthz` e o `curl` em `https://CRM_DOMAIN/healthz` terminam sem erro. Se o público falhar com o container saudável, o registro A ou o certificado ainda não chegou. Corrija e rode o script de novo.

Para repetir um deploy (nova tag ou env alterado): edite `.env.production` e rode `./deploy/aws/deploy.sh` outra vez.

## O que o entrypoint faz

A imagem usa `ENTRYPOINT /app/entrypoint.sh` e o server roda `node dist/main`. Com `DISABLE_DB_MIGRATIONS` diferente de `true`, o entrypoint consulta o schema `core` com `psql`. Banco vazio: `yarn database:init:prod`. Em seguida `yarn command:prod upgrade` e o registro dos crons. O worker sobe com `yarn worker:prod`, `DISABLE_DB_MIGRATIONS=true` e `DISABLE_CRON_JOBS_REGISTRATION=true`, e só depois do server ficar healthy. Não rode migração na mão.

## O que fica com o dono

- Senha SMTP real e o endereço `EMAIL_FROM_*`
- Confirmar `CRM_DOMAIN` e `ACME_EMAIL`
- Primeiro usuário, com e-mail em `iosei.co`, `mstecnologia.med.br` ou `i-rad.co`, depois o SSO em [`docs/SSO_GOOGLE_PT.md`](docs/SSO_GOOGLE_PT.md)
- Não definir `ENTERPRISE_KEY`
