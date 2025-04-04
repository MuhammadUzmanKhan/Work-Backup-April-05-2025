import hashlib
import hmac
import urllib.parse

from backend.aws_signer.aws_signer_models import AWSCredentials
from backend.s3_utils import SAFE_CHARS, SIGN_ALGORITHM, RequestTime
from backend.utils import AwareDatetime


# NOTE(@lberg): this is a re-implementation of the AWS SigV4 signing process
# for websocket connections. It is based on the following resources:
# https://raw.githubusercontent.com/awslabs/amazon-kinesis-video-streams-webrtc-sdk-js/master/src/SigV4RequestSigner.ts
class SignV4RequestSigner:
    def __init__(self, region: str, credentials: AWSCredentials) -> None:
        self.region = region
        self.credentials = credentials
        self.service = "kinesisvideo"

    def getSignedURL(
        self, endpoint: str, queryParams: dict[str, str], date: AwareDatetime
    ) -> str:
        # Prepare date strings
        request_time = RequestTime.from_datetime(date)

        # Validate and parse endpoint
        protocol = "wss"
        urlProtocol = f"{protocol}://"
        if not endpoint.startswith(urlProtocol):
            raise ValueError(f"Endpoint '{endpoint}' should start with {protocol}.")

        if "?" in endpoint:
            raise ValueError(f"Endpoint '{endpoint}' can't have query params.")
        try:
            pathStartIndex = endpoint.index("/", len(urlProtocol))
            host = endpoint[:pathStartIndex]
            path = endpoint[pathStartIndex:]
        except ValueError:
            host = endpoint[len(urlProtocol) :]
            path = "/"

        signedHeaders = "host"
        method = "GET"

        # Prepare canonical query string
        credentialScope = (
            request_time.date
            + "/"
            + self.region
            + "/"
            + self.service
            + "/"
            + "aws4_request"
        )
        canonicalQueryParams = {
            **queryParams,
            "X-Amz-Algorithm": SIGN_ALGORITHM,
            "X-Amz-Credential": self.credentials.access_key + "/" + credentialScope,
            "X-Amz-Date": request_time.date_time,
            "X-Amz-Expires": "86400",
            "X-Amz-SignedHeaders": signedHeaders,
        }

        if self.credentials.token:
            canonicalQueryParams["X-Amz-Security-Token"] = self.credentials.token

        canonicalQueryString = SignV4RequestSigner.createQueryString(
            canonicalQueryParams
        )
        # Prepare canonical headers
        canonicalHeaders = {"host": host}
        canonicalHeadersString = SignV4RequestSigner.createHeadersString(
            canonicalHeaders
        )
        # Prepare payload hash
        payloadHash = SignV4RequestSigner.sha256("")
        # Combine canonical request parts into a canonical request string and hash
        canonicalRequest = "\n".join(
            [
                method,
                path,
                canonicalQueryString,
                canonicalHeadersString,
                signedHeaders,
                payloadHash,
            ]
        )
        canonicalRequestHash = SignV4RequestSigner.sha256(canonicalRequest)

        # Create signature
        stringToSign = "\n".join(
            [
                SIGN_ALGORITHM,
                request_time.date_time,
                credentialScope,
                canonicalRequestHash,
            ]
        )
        signingKey = self.getSignatureKey(request_time.date)
        signature = SignV4RequestSigner.toHex(self.hmac(signingKey, stringToSign))

        # Add signature to query params
        signedQueryParams = {**canonicalQueryParams, "X-Amz-Signature": signature}

        # Create signed URL
        return (
            protocol
            + "://"
            + host
            + path
            + "?"
            + SignV4RequestSigner.createQueryString(signedQueryParams)
        )

    @staticmethod
    def createQueryString(queryParams: dict[str, str]) -> str:
        return "&".join(
            [
                f"{key}={urllib.parse.quote(queryParams[key], safe=SAFE_CHARS)}"
                for key in sorted(queryParams.keys())
            ]
        )

    @staticmethod
    def createHeadersString(headers: dict[str, str]) -> str:
        return "".join([f"{key}:{headers[key]}\n" for key in headers.keys()])

    @staticmethod
    def sha256(message: str) -> str:
        return hashlib.sha256(message.encode()).hexdigest()

    def getSignatureKey(self, dateString: str) -> bytes:
        kDate = self.hmac(("AWS4" + self.credentials.secret_key).encode(), dateString)
        kRegion = self.hmac(kDate, self.region)
        kService = self.hmac(kRegion, self.service)
        return self.hmac(kService, "aws4_request")

    @staticmethod
    def toHex(buffer: bytes) -> str:
        return buffer.hex()

    @staticmethod
    def hmac(key: bytes, msg: str) -> bytes:
        return hmac.new(key, msg.encode(), hashlib.sha256).digest()
