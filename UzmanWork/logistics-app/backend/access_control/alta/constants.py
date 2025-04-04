import secrets
import string

ALTA_INTEGRATION_USER_NAME = "Coram AI Integration"
SUPER_ADMIN_ROLE_NAME = "Super Admin"
CLOUD_KEY_MODEL_NAME = "cloudKey"


def generate_alta_integration_user_credential_cloud_key_name() -> str:
    return f"Coram AI Integration Cloud Key {_generate_random_string(6)}"


def get_auth_certificate_identifier(org_id: str) -> str:
    return f"Coram:{org_id}"


def get_alta_integration_user_email(tenant: str) -> str:
    return f"integrations_alta_{tenant}@coram.ai"


def _generate_random_string(length: int) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))
