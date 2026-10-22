#!/usr/bin/env bash
# Idempotent production deploy for the Twenty CRM EC2 host.
# Reads .env.production at the repo root unless ENV_FILE is set.
set -euo pipefail
export LC_ALL=C

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"
COMPOSE_FILE="$ROOT/packages/twenty-docker/docker-compose.prod.yml"
EXPECTED_DOMAINS=$'i-rad.co\niosei.co\nmstecnologia.med.br'

die() {
  echo "erro: $*" >&2
  exit 1
}

as_root() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

reject_placeholder() {
  local name="$1"
  local value="$2"

  [[ -n "$value" ]] || die "$name está vazio"
  [[ ${#value} -ge 32 ]] || die "$name precisa de pelo menos 32 caracteres"
  [[ "$value" != *replace_me* && "$value" != *changeme* && "$value" != *example* ]] ||
    die "$name ainda está com o valor de exemplo"
}

install_docker() {
  if as_root docker compose version >/dev/null 2>&1; then
    return
  fi

  [[ -r /etc/os-release ]] || die "este script instala Docker só no Ubuntu"
  # shellcheck disable=SC1091
  . /etc/os-release
  [[ "${ID:-}" == "ubuntu" ]] || die "sistema $ID não é Ubuntu 24.04"

  as_root apt-get update
  as_root apt-get install -y ca-certificates curl
  as_root install -m 0755 -d /etc/apt/keyrings
  as_root curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  as_root chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" |
    as_root tee /etc/apt/sources.list.d/docker.list >/dev/null
  as_root apt-get update
  as_root apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  as_root systemctl enable --now docker

  if [[ -n "${SUDO_USER:-}" && "$SUDO_USER" != "root" ]]; then
    as_root usermod -aG docker "$SUDO_USER" || true
  fi
}

load_env() {
  [[ -f "$ENV_FILE" ]] || die "arquivo de ambiente não encontrado: $ENV_FILE"
  [[ "$ENV_FILE" != *.example ]] || die "aponte ENV_FILE para .env.production, não para o exemplo"

  chmod 600 "$ENV_FILE" 2>/dev/null || as_root chmod 600 "$ENV_FILE"

  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
}

normalized_domains() {
  printf '%s' "$1" |
    tr '[:upper:]' '[:lower:]' |
    tr ',' '\n' |
    sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^@//' |
    sed '/^$/d' |
    sort -u
}

validate_env() {
  load_env

  [[ "${CRM_DOMAIN:-}" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]] ||
    die "CRM_DOMAIN inválido"
  [[ "${SERVER_URL:-}" == "https://${CRM_DOMAIN}" ]] ||
    die "SERVER_URL precisa ser exatamente https://${CRM_DOMAIN}"
  [[ "${ACME_EMAIL:-}" == *@* ]] || die "ACME_EMAIL inválido"
  [[ "${TAG:-}" =~ ^sha-[0-9a-f]{7,40}$ ]] ||
    die "TAG precisa ser uma tag sha-* publicada (não use latest)"

  [[ "${PG_SSL_ALLOW_SELF_SIGNED:-}" == "true" ]] ||
    die "PG_SSL_ALLOW_SELF_SIGNED=true é obrigatório para o RDS"
  [[ "${PG_DATABASE_URL:-}" =~ ^postgres(ql)?://[A-Za-z0-9_]+:[0-9a-fA-F]{32,}@[A-Za-z0-9.-]+:5432/default\?(.*&)?sslmode=require(&.*)?$ ]] ||
    die "PG_DATABASE_URL precisa ser postgres://usuario:hex@host:5432/default?sslmode=require"

  [[ "${REDIS_PASSWORD:-}" =~ ^[0-9a-fA-F]{32,}$ ]] ||
    die "REDIS_PASSWORD precisa ser hex de pelo menos 32 caracteres (openssl rand -hex 32)"

  reject_placeholder ENCRYPTION_KEY "${ENCRYPTION_KEY:-}"
  reject_placeholder APP_SECRET "${APP_SECRET:-}"
  [[ "$ENCRYPTION_KEY" != "$APP_SECRET" ]] || die "ENCRYPTION_KEY e APP_SECRET precisam ser diferentes"
  [[ -z "${ENTERPRISE_KEY:-}" ]] || die "ENTERPRISE_KEY não pode ser definida"

  local storage="${STORAGE_TYPE:-}"
  storage="$(printf '%s' "$storage" | tr '[:upper:]' '[:lower:]')"
  case "$storage" in
    s3 | s_3)
      [[ "${STORAGE_S3_REGION:-}" == "sa-east-1" ]] || die "STORAGE_S3_REGION precisa ser sa-east-1"
      [[ -n "${STORAGE_S3_NAME:-}" && "${STORAGE_S3_NAME}" != *replace_me* ]] ||
        die "STORAGE_S3_NAME está vazio"
      [[ -z "${STORAGE_S3_ENDPOINT:-}" ]] ||
        die "deixe STORAGE_S3_ENDPOINT vazio na AWS; o SDK resolve a região"
      if [[ -n "${STORAGE_S3_ACCESS_KEY_ID:-}" || -n "${STORAGE_S3_SECRET_ACCESS_KEY:-}" ]]; then
        [[ -n "${STORAGE_S3_ACCESS_KEY_ID:-}" && -n "${STORAGE_S3_SECRET_ACCESS_KEY:-}" ]] ||
          die "chave S3 incompleta; para usar a role da instância deixe as duas vazias"
      else
        echo "S3 sem chaves: a instância precisa da instance profile e de IMDS hop limit 2."
      fi
      ;;
    local)
      echo "STORAGE_TYPE=local: arquivos ficam no volume server-local-data desta EC2."
      ;;
    *)
      die "STORAGE_TYPE precisa ser s3 ou local"
      ;;
  esac

  local email_driver="${EMAIL_DRIVER:-}"
  email_driver="$(printf '%s' "$email_driver" | tr '[:lower:]' '[:upper:]')"
  [[ "$email_driver" == "SMTP" ]] || die "EMAIL_DRIVER precisa ser smtp"
  [[ -n "${EMAIL_SMTP_HOST:-}" ]] || die "EMAIL_SMTP_HOST está vazio"
  [[ "${EMAIL_SMTP_PORT:-}" == "587" || "${EMAIL_SMTP_PORT:-}" == "465" ]] ||
    die "EMAIL_SMTP_PORT precisa ser 587 ou 465"
  [[ "${EMAIL_SMTP_NO_TLS:-false}" == "false" ]] || die "EMAIL_SMTP_NO_TLS precisa ser false"
  [[ -n "${EMAIL_FROM_ADDRESS:-}" && "${EMAIL_FROM_ADDRESS}" == *@* ]] ||
    die "EMAIL_FROM_ADDRESS inválido"
  [[ -n "${EMAIL_SMTP_USER:-}" ]] || die "EMAIL_SMTP_USER está vazio"
  [[ -n "${EMAIL_SMTP_PASSWORD:-}" && "${EMAIL_SMTP_PASSWORD}" != *replace_me* ]] ||
    die "EMAIL_SMTP_PASSWORD ainda é o valor de exemplo"

  local actual_domains
  actual_domains="$(normalized_domains "${SSO_ALLOWED_EMAIL_DOMAINS:-}")"
  [[ "$actual_domains" == "$EXPECTED_DOMAINS" ]] ||
    die "SSO_ALLOWED_EMAIL_DOMAINS precisa ser exatamente iosei.co,mstecnologia.med.br,i-rad.co"

  echo "ambiente válido para ${CRM_DOMAIN} (imagem ${TAG})"
}

wait_for_healthz() {
  local compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

  if ! as_root "${compose[@]}" up -d --pull always --remove-orphans --wait --wait-timeout 600; then
    as_root "${compose[@]}" ps || true
    as_root "${compose[@]}" logs --tail 200 server worker caddy || true
    die "a stack não ficou saudável em 600s"
  fi

  echo "healthz dentro do container:"
  as_root "${compose[@]}" exec -T server \
    curl --fail --silent --show-error http://localhost:3000/healthz
  echo

  local public_ip="" token=""
  token="$(curl --fail --silent --show-error --max-time 2 -X PUT \
    "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 60" || true)"
  if [[ -n "$token" ]]; then
    public_ip="$(curl --fail --silent --show-error --max-time 2 \
      -H "X-aws-ec2-metadata-token: $token" \
      http://169.254.169.254/latest/meta-data/public-ipv4 || true)"
  fi

  local resolved=""
  resolved="$(getent ahostsv4 "$CRM_DOMAIN" | awk '{print $1; exit}' || true)"
  if [[ -n "$public_ip" && -n "$resolved" && "$public_ip" != "$resolved" ]]; then
    echo "aviso: $CRM_DOMAIN resolve para $resolved e o Elastic IP desta instância é $public_ip" >&2
  fi

  echo "healthz público:"
  if ! curl --fail --silent --show-error --retry 12 --retry-delay 10 --retry-all-errors \
    "https://${CRM_DOMAIN}/healthz"; then
    echo
    die "https://${CRM_DOMAIN}/healthz não respondeu. O container está no ar; confira o registro A e o certificado do Caddy (docker compose logs caddy)."
  fi
  echo
  echo "https://${CRM_DOMAIN}/healthz ok"
}

install_docker
validate_env

if [[ "${VALIDATE_ONLY:-}" == "1" ]]; then
  echo "VALIDATE_ONLY=1: stack não foi alterada"
  exit 0
fi

wait_for_healthz
