from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class SilentJWTAuthentication(JWTAuthentication):
    """
    Like JWTAuthentication but treats an invalid or expired token as anonymous
    instead of immediately raising HTTP 401.

    Why this is needed:
        DRF runs authentication *before* permission checks. With the standard
        JWTAuthentication, sending an expired token to a public (AllowAny)
        endpoint still results in a 401 — the user can't even see the doctor list
        after their token expires.

    How it works:
        - If there is NO token in the request → returns None (anonymous). Same as default.
        - If there IS a token and it is valid → returns (user, token). Same as default.
        - If there IS a token but it is invalid/expired → returns None (anonymous)
          instead of raising 401. The permission layer (IsAuthenticated) will then
          correctly deny access to protected endpoints, while AllowAny endpoints
          continue to work.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except AuthenticationFailed:
            return None
