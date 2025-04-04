from datetime import datetime, timedelta
from typing import Any, Type

import jwt
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey
from cryptography.x509.oid import NameOID

from backend.access_control import http_client_utils as http_client
from backend.access_control.alta import models
from backend.utils import AwareDatetime

from .constants import get_auth_certificate_identifier


class AltaClient:
    @staticmethod
    async def authorize(
        email: str, password: str, mfa_code: str | None
    ) -> models.AltaAuthorisationData:
        """Authorize the client to access the Alta API."""

        login_response = await AltaClient._login(email, password, mfa_code)

        # Extract org ID from response
        # There should be only one org in response but this is unclear from the API docs
        org_ids = [
            token_scope.org.id
            for token_scope in login_response.data.tokenScopeList
            if token_scope.org.id is not None
        ]
        if len(org_ids) != 1:
            raise models.AltaError(
                f"Unexpected number of orgs in Alta API response: {org_ids}"
            )

        token = login_response.data.token
        org_id = org_ids[0]
        private_key_str, public_key_str = AltaClient._create_rsa_certificate_key_pair()

        # Assign a certificate to an organisation
        try:
            response = await http_client.send_http_request(
                method=http_client.HTTPMethods.HTTP_POST,
                endpoint=f"https://api.openpath.com/orgs/{org_id}/authCerts",
                headers={"Authorization": token},
                json={
                    "name": get_auth_certificate_identifier(str(org_id)),
                    "roleId": 5,
                    "certificate": public_key_str,
                },
                response_class=models.AltaCreateAuthCertificateResponse,
            )
        except http_client.SendHTTPRequestError as e:
            raise models.AltaError(f"Error while calling Alta API: {e}")

        if response is None:
            raise models.AltaError("Alta response is empty")

        return models.AltaAuthorisationData(
            public_key=public_key_str,
            private_key=private_key_str,
            cert_id=response.data.id,
            org_id=org_id,
            remote_unlock_enabled=False,
        )

    @staticmethod
    async def _send_request(
        method: http_client.HTTPMethods,
        api: str,
        auth_data: models.AltaAuthorisationData,
        params: dict[str, Any] = {},
        json: dict[str, Any] | list[dict[str, Any]] = {},
        response_class: Type[http_client.TBaseModel] | None = None,
    ) -> http_client.TBaseModel | None:
        cert_id = auth_data.cert_id
        private_key_str = auth_data.private_key
        jwt_token = AltaClient._generate_jwt_with_rsa_key(str(cert_id), private_key_str)

        endpoint = "https://api.openpath.com/orgs/{}/".format(auth_data.org_id) + api
        headers = {"Authorization": jwt_token}

        try:
            return await http_client.send_http_request(
                method=method,
                endpoint=endpoint,
                headers=headers,
                params=params,
                json=json,
                response_class=response_class,
            )
        except http_client.SendHTTPRequestError as e:
            raise models.AltaError(f"Error while calling Alta API: {e}")

    @staticmethod
    async def list_zones(
        auth_data: models.AltaAuthorisationData,
    ) -> list[models.AltaZoneData]:
        """
        List all existing zones in Alta.
        https://openpath.readme.io/reference/listzones
        """

        response = await AltaClient._send_request(
            method=http_client.HTTPMethods.HTTP_GET,
            api="zones",
            auth_data=auth_data,
            response_class=models.AltaListZonesResponse,
        )

        if response is None:
            raise models.AltaError("Alta response is empty")

        return response.data

    @staticmethod
    async def set_user_zones(
        auth_data: models.AltaAuthorisationData,
        user_id: int,
        payload: list[models.AltaSetUserZoneRequestBody],
    ) -> None:
        """
        Set the zones for a user in Alta.
        https://openpath.readme.io/reference/setuserzoneusers
        """

        await AltaClient._send_request(
            method=http_client.HTTPMethods.HTTP_PUT,
            api=f"users/{user_id}/zoneUsers",
            auth_data=auth_data,
            json=[zone.dict() for zone in payload],
            response_class=None,
        )

    @staticmethod
    async def list_entries(
        auth_data: models.AltaAuthorisationData,
    ) -> list[models.AltaEntry]:
        """
        List all access points for the tenant. Returns empty if not authorized.
        https://openpath.readme.io/reference/listentries
        """

        response = await AltaClient._send_request(
            method=http_client.HTTPMethods.HTTP_GET,
            api="entries",
            auth_data=auth_data,
            response_class=models.AltaEntries,
        )
        if response is None:
            raise models.AltaError("Alta response is empty")

        return response.data

    @staticmethod
    async def list_events(
        auth_data: models.AltaAuthorisationData,
        start_time: AwareDatetime,
        end_time: AwareDatetime,
    ) -> list[models.AltaEvent]:
        """
        List all Alta access events.
        https://openpath.readme.io/reference/getactivityevents-1
        """

        start_epoch = int(start_time.timestamp())
        end_epoch = int(end_time.timestamp())

        response = await AltaClient._send_request(
            method=http_client.HTTPMethods.HTTP_GET,
            api="reports/activity/events",
            auth_data=auth_data,
            params={"filter": f"uiData.time:({start_epoch}-<{end_epoch})"},
            response_class=models.AltaGetActivityEventsResponse,
        )
        if response is None:
            raise models.AltaError("Alta response is empty")

        return [item.uiData for item in response.data]

    @staticmethod
    async def get_user_by_email(
        auth_data: models.AltaAuthorisationData, email: str
    ) -> models.AltaUserData | None:
        """
        Lists all users in Alta with the given email. Returns None if no user found.
        https://openpath.readme.io/reference/listusers
        """

        response = await AltaClient._send_request(
            method=http_client.HTTPMethods.HTTP_GET,
            api="users",
            auth_data=auth_data,
            params={"filter": f"identity.email:({email})"},
            response_class=models.AltaListUsersResponse,
        )
        if response is None:
            raise models.AltaError("Alta response is empty")

        users = response.data
        if len(users) == 1:
            return users[0]
        elif len(users) == 0:
            return None
        else:
            raise models.AltaError(f"Multiple users found with email {email}")

    @staticmethod
    async def create_user(
        auth_data: models.AltaAuthorisationData,
        user_data: models.AltaCreateUserRequestBody,
    ) -> models.AltaUserData:
        """
        Create a new user in Alta. Returns the user data if successful.
        https://openpath.readme.io/reference/createuser
        """

        response = await AltaClient._send_request(
            method=http_client.HTTPMethods.HTTP_POST,
            api="users",
            auth_data=auth_data,
            json=user_data.dict(),
            response_class=models.AltaCreateUserResponse,
        )
        if response is None:
            raise models.AltaError("Alta response is empty")

        return response.data

    @staticmethod
    async def list_roles(
        auth_data: models.AltaAuthorisationData,
    ) -> list[models.AltaListRolesResponseData]:
        """
        List all roles in Alta.
        https://openpath.readme.io/reference/listroles
        """

        response = await AltaClient._send_request(
            method=http_client.HTTPMethods.HTTP_GET,
            api="roles",
            auth_data=auth_data,
            response_class=models.AltaListRolesResponse,
        )
        if response is None:
            raise models.AltaError("Alta response is empty")

        return response.data

    @staticmethod
    async def list_credential_types(
        auth_data: models.AltaAuthorisationData,
    ) -> list[models.AltaCredentialTypesData]:
        """
        List all credential types in Alta.
        https://openpath.readme.io/reference/listcredentialtypes
        """

        response = await AltaClient._send_request(
            method=http_client.HTTPMethods.HTTP_GET,
            api="credentialTypes",
            auth_data=auth_data,
            response_class=models.AltaListCredentialTypesResponse,
        )
        if response is None:
            raise models.AltaError("Alta response is empty")

        return response.data

    @staticmethod
    async def add_user_to_role(
        auth_data: models.AltaAuthorisationData, user_id: int, role_id: int
    ) -> None:
        """
        Add a user to a role in Alta.
        https://openpath.readme.io/reference/setusertorole
        """

        await AltaClient._send_request(
            method=http_client.HTTPMethods.HTTP_PUT,
            api=f"roles/{role_id}/users/{user_id}",
            auth_data=auth_data,
        )

    @staticmethod
    async def list_user_credentials(
        auth_data: models.AltaAuthorisationData, user_id: int
    ) -> list[models.AltaCredentialData]:
        """
        Create a credential for a user in Alta.
        https://openpath.readme.io/reference/createcredential
        """

        response = await AltaClient._send_request(
            method=http_client.HTTPMethods.HTTP_GET,
            api=f"users/{user_id}/credentials",
            auth_data=auth_data,
            response_class=models.AltaListUserCredentialsResponse,
        )
        if response is None:
            raise models.AltaError("Alta response is empty")

        return response.data

    @staticmethod
    async def create_user_credential(
        auth_data: models.AltaAuthorisationData,
        user_id: int,
        payload: models.AltaCreateUserCredentialRequestBody,
    ) -> models.AltaCredentialData:
        """
        Create a credential for a user in Alta.
        https://openpath.readme.io/reference/createcredential
        """

        response = await AltaClient._send_request(
            method=http_client.HTTPMethods.HTTP_POST,
            api=f"users/{user_id}/credentials",
            auth_data=auth_data,
            json=payload.dict(),
            response_class=models.AltaCreateCredentialResponse,
        )
        if response is None:
            raise models.AltaError("Alta response is empty")

        return response.data

    @staticmethod
    async def unlock_access_point(
        auth_data: models.AltaAuthorisationData,
        user_id: int,
        credential_id: int,
        access_point_id: int,
    ) -> None:
        """
        Unlock an access point for a user in Alta.
        https://openpath.readme.io/reference/cloudkeyentryunlock
        """

        await AltaClient._send_request(
            method=http_client.HTTPMethods.HTTP_POST,
            api=f"users/{user_id}/credentials/{credential_id}/cloudKeyEntryUnlock",
            auth_data=auth_data,
            json={"entryId": access_point_id},
        )

    @staticmethod
    async def _login(
        email: str, password: str, mfa_code: str | None
    ) -> models.AltaLoginResponse:
        # Assign a certificate to an organisation
        try:
            if mfa_code is not None:
                # Post with JSON if MFA code is provided
                json = models.AuthorizeAltaWithMFARequest(
                    email=email,
                    password=password,
                    mfa=models.AuthorizeAltaMFA(totpCode=mfa_code),
                ).dict()
                data = None
            else:
                # Post as form data if no MFA code
                json = None
                data = {"email": email, "password": password}

            response = await http_client.send_http_request(
                method=http_client.HTTPMethods.HTTP_POST,
                endpoint="https://api.openpath.com/auth/login",
                json=json,
                data=data,
                response_class=models.AltaLoginResponse,
            )
        except http_client.SendHTTPRequestError as e:
            raise models.AltaError(f"Error while calling Alta API: {e}")

        if not response:
            raise models.AltaError("Alta response is empty")

        return response

    @staticmethod
    def _create_rsa_certificate_key_pair() -> tuple[str, str]:
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

        subject = issuer = x509.Name(
            [
                x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
                x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "California"),
                x509.NameAttribute(NameOID.LOCALITY_NAME, "Sunnyvale"),
                x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Coram AI"),
                x509.NameAttribute(NameOID.COMMON_NAME, "coram.ai"),
            ]
        )

        now = datetime.utcnow()
        expiration_date = now + timedelta(days=365 * 2)

        certificate = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now)
            .not_valid_after(expiration_date)
            .add_extension(
                x509.SubjectAlternativeName([x509.DNSName("coram.ai")]), critical=False
            )
            .sign(private_key, hashes.SHA256())
        )

        private_key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        public_key = certificate.public_bytes(serialization.Encoding.PEM)

        private_key_str = private_key_pem.decode("utf-8")
        public_key_str = public_key.decode("utf-8")

        return private_key_str, public_key_str

    @staticmethod
    def _generate_jwt_with_rsa_key(cert_id: str, private_key_str: str) -> str:
        private_key = serialization.load_pem_private_key(
            private_key_str.encode("utf-8"), password=None
        )

        if not isinstance(private_key, RSAPrivateKey):
            raise TypeError("The loaded key is not an RSA private key.")

        token = jwt.encode(
            {}, private_key, algorithm="RS256", headers={"kid": f"orgCertId:{cert_id}"}
        )

        return token
