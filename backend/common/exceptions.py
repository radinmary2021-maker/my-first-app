"""
common/exceptions.py
Domain-level exceptions used throughout the project.

Pattern: raise from service layer → caught in views or DRF exception handler.
"""


class NobatError(Exception):
    """Base class for all Nobatic domain errors."""
    default_message = 'یک خطای ناشناخته رخ داده است.'

    def __init__(self, message: str | None = None):
        self.message = message or self.default_message
        super().__init__(self.message)


class QuotaExceededError(NobatError):
    """Subscription quota has been reached."""
    default_message = 'سقف مجاز پلن شما تکمیل شده است.'


class BusinessNotFoundError(NobatError):
    """User has no associated business."""
    default_message = 'کسب‌وکاری برای این حساب یافت نشد.'


class MemberAlreadyExistsError(NobatError):
    """Trying to add a member that already belongs to the business."""
    default_message = 'این کاربر قبلاً عضو این کسب‌وکار است.'


class CannotRemoveOwnerError(NobatError):
    """Trying to remove the business owner from members."""
    default_message = 'مالک کسب‌وکار را نمی‌توان حذف کرد.'


class PermissionDeniedError(NobatError):
    """Generic permission violation from the service layer."""
    default_message = 'شما مجاز به انجام این عملیات نیستید.'


class SlotUnavailableError(NobatError):
    """Requested appointment slot is no longer available."""
    default_message = 'این زمان دیگر در دسترس نیست.'


class ProviderAlreadyExistsError(NobatError):
    """Trying to create a provider for a user that already has a provider profile."""
    default_message = 'این کاربر پروفایل ارائه‌دهنده دارد.'
