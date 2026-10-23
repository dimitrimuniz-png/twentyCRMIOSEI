# Produção na AWS — estado em 23/10/2026

Registro da sessão que subiu https://crm-iosei.com (22 e 23/10/2026). O passo a passo de provisionamento continua em [`DEPLOY_AWS_HANDOFF.md`](../DEPLOY_AWS_HANDOFF.md); este documento diz o que existe hoje, como operar e o que ficou pendente. Nenhum segredo aparece aqui: eles ficam só em `/opt/twenty/.env.production` na EC2.

## Conta e acesso

- Conta AWS `695687221267`, membro de uma AWS Organization (conta gestora `554743669099`). A mesma conta hospeda o `irad-greenfield-prod`; nada dele foi alterado.
- Região `sa-east-1`, VPC default.
- Operação pelo profile `twenty-crm` (usuário IAM `twenty-crm-operator`). Ele só escreve em recursos com a tag `Project=twenty-crm`, na zona `crm-iosei.com`, no bucket do projeto e em nomes `twenty-crm-*`. Políticas: `twenty-crm-operator-compute`, `twenty-crm-operator-access` e `twenty-crm-operator-monitoring`.
- Acesso à EC2 só pelo Session Manager (SSM). Não há SSH nem porta 3000 aberta.

## Tags

Todo recurso criado leva:

| Chave | Valor |
| --- | --- |
| `Project` | `twenty-crm` |
| `Environment` | `production` |
| `Owner` | `dimitri.muniz` |
| `CostCenter` | `iosei` |
| `ManagedBy` | `claude-code` |

Para o custo aparecer separado no Cost Explorer, a conta gestora precisa ativar `Project` e `CostCenter` como cost allocation tags. Conta-membro não consegue fazer isso.

## Recursos

| Recurso | Identificador |
| --- | --- |
| EC2 (`t4g.large`, Ubuntu 24.04 arm64, gp3 30 GiB criptografado, IMDSv2 com hop limit 2) | `i-0fd65888cf87700a7` |
| Elastic IP | `54.21.15.36` |
| Instance profile / role | `twenty-crm-ec2` (SSM Core, CloudWatch Agent, política inline do bucket) |
| RDS PostgreSQL 16.15 (`db.t4g.small`, Single-AZ, gp3 20 GiB, sem IP público, `rds.force_ssl=1`) | `twenty-crm-postgres` |
| Parameter group / subnet group | `twenty-crm-pg16` / `twenty-crm-default-vpc` |
| Security groups | `sg-05d5d667108a8b1ef` (EC2: 80 e 443) / `sg-063d4fcfa13aed133` (RDS: 5432 só da EC2) |
| Bucket S3 (versionado, SSE-S3, Block Public Access) | `twenty-crm-iosei-84dec0` |
| Zona Route 53 (exclusiva do projeto) | `crm-iosei.com` (`Z01420612KO9EOKECPV05`) |

O registro do domínio é do Route 53 Domains, com titular `arthur@mstecnologia.med.br`. Se a verificação de e-mail do titular expirar, o domínio entra em `clientHold` e sai do ar.

## Aplicação

- Código em `/opt/twenty`, na `main`. Imagem `ghcr.io/dimitrimuniz-png/twentycrmiosei:sha-bf11306`, fixada por `TAG` no `.env.production`.
- Stack: server, worker, Redis e Caddy (certificado Let's Encrypt para `crm-iosei.com`).
- O banco se chama `default`. A API do RDS recusa esse nome, então ele foi criado com `CREATE DATABASE "default";`.
- O server confia na CA do RDS pelo `rds-global-bundle.pem` que o `deploy.sh` baixa (PR 5). Sem isso o `pg` falha com `SELF_SIGNED_CERT_IN_CHAIN`.
- Workspace `IOSEI` (subdomínio `iosei`). Dono e admin do servidor: `dimitri@iosei.co`.

### Novo deploy

Pelo SSM, como `ubuntu`:

```bash
cd /opt/twenty
git fetch --depth 1 origin main && git checkout -B main FETCH_HEAD
# edite .env.production (por exemplo TAG=sha-xxxxxxx)
./deploy/aws/deploy.sh
```

O script é idempotente, valida o env e espera o `/healthz` interno e o público.

### Primeiro workspace numa instalação vazia

Com `IS_MULTIWORKSPACE_ENABLED=false` e nenhum workspace, o login por senha e o reenvio da verificação de e-mail procuram o workspace padrão e respondem `WORKSPACE_NOT_FOUND`. Com `IS_EMAIL_VERIFICATION_REQUIRED=true` não há como criar o primeiro workspace. O que funcionou:

1. Desligar `IS_EMAIL_VERIFICATION_REQUIRED` e rodar o `deploy.sh`.
2. Cadastrar o primeiro usuário (vira admin do servidor) e criar o workspace.
3. Religar a verificação, rodar o `deploy.sh` e verificar o e-mail pelo reenvio, que passa a funcionar.

## Backups

- Backup automático do RDS com retenção de 7 dias, janela 06:00–07:00 UTC (03:00–04:00 em Brasília), `CopyTagsToSnapshot` ligado.
- Deletion protection ligada.
- Snapshot manual `twenty-crm-pos-sso-2026-10-22`, criado depois do SSO.
- Bucket S3 com versionamento.

## Monitoramento

Alertas por e-mail para `dimitri@iosei.co` pelo tópico SNS `twenty-crm-alerts`, que existe em `sa-east-1` e em `us-east-1` (as métricas do health check do Route 53 só existem em `us-east-1`). Cada alarme avisa ao disparar e ao voltar ao normal.

| Alarme | Condição |
| --- | --- |
| `twenty-crm-ec2-cpu-high` | CPU > 80% por 10 min |
| `twenty-crm-ec2-status-check-failed` | status check falhando por 2 min |
| `twenty-crm-ec2-disk-root-high` | disco `/` > 80% por 10 min (CloudWatch Agent) |
| `twenty-crm-rds-cpu-high` | CPU > 80% por 10 min |
| `twenty-crm-rds-free-storage-low` | espaço livre < 2 GB |
| `twenty-crm-rds-freeable-memory-low` | memória livre < 256 MB por 10 min |
| `twenty-crm-rds-connections-high` | mais de 100 conexões por 10 min |
| `twenty-crm-site-down` (`us-east-1`) | health check HTTPS de `crm-iosei.com/healthz` falhando por 2 min |

O CloudWatch Agent na EC2 publica `mem_used_percent` e `disk_used_percent` do `/` a cada 60 s, no namespace `CWAgent`.

## Custo mensal estimado

Preços on-demand de lista em `sa-east-1` (API de preços da AWS, 23/10/2026), 730 h/mês, sem impostos.

| Item | Preço | US$/mês |
| --- | --- | --- |
| EC2 `t4g.large` | 0,1072/h | ~78,3 |
| EBS gp3 30 GiB | 0,152/GB-mês | ~4,6 |
| RDS `db.t4g.small` Single-AZ | 0,069/h | ~50,4 |
| RDS gp3 20 GiB | 0,219/GB-mês | ~4,4 |
| S3, Route 53 (zona e consultas), transferência | uso | ~2 |
| Monitoramento (8 alarmes, 2 métricas, health check HTTPS) | | ~2,9 |
| Elastic IP anexado a instância ligada | | 0 |
| **Total** | | **~143** |

## Pendências

- Conta gestora `554743669099`: ativar as cost allocation tags `Project` e `CostCenter`.
- Confirmar as duas assinaturas de e-mail do SNS (uma por região). Sem isso os alarmes não enviam e-mail.
- Apagar os backups locais de credenciais `~/.aws/credentials.bak-20261022` e `~/.aws/config.bak-20261022`.
- RDS com upgrade automático de minor desligado. Decidir se religa.
- Corrigir no fork o `WORKSPACE_NOT_FOUND` do login e do reenvio de verificação numa instalação vazia.
