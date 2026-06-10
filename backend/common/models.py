"""
common/models.py
Abstract base models shared across all apps.

These classes carry NO migrations — they are abstract=True.
Concrete subclasses own the table and the migration.
"""

from django.db import models
from django.utils import timezone


# ──────────────────────────────────────────────────────────────────────────────
# TimeStamped
# ──────────────────────────────────────────────────────────────────────────────

class TimeStampedModel(models.Model):
    """Adds auto-managed created_at / updated_at to every subclass."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ──────────────────────────────────────────────────────────────────────────────
# SoftDelete
# ──────────────────────────────────────────────────────────────────────────────

class SoftDeleteQuerySet(models.QuerySet):
    """QuerySet that understands alive / dead records."""

    def alive(self):
        return self.filter(is_deleted=False)

    def dead(self):
        return self.filter(is_deleted=True)

    def delete(self):
        """Bulk soft-delete: update instead of DELETE SQL."""
        return self.update(is_deleted=True, deleted_at=timezone.now())

    def hard_delete(self):
        """Bypass soft-delete and execute a real DELETE."""
        return super().delete()


class SoftDeleteManager(models.Manager):
    """Default manager: only returns alive (non-deleted) rows."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    """Secondary manager: returns ALL rows, including soft-deleted ones."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db)


class SoftDeleteModel(TimeStampedModel):
    """
    Soft-delete base class.

    Usage:
        Model.objects      → alive rows only  (default manager)
        Model.all_objects  → all rows (including deleted)

    Instance methods:
        instance.delete()       → soft-delete
        instance.hard_delete()  → permanent DELETE
        instance.restore()      → undo soft-delete
    """

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects     = SoftDeleteManager()
    all_objects = AllObjectsManager()

    def delete(self, using=None, keep_parents=False):  # noqa: ARG002
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def hard_delete(self):
        super().delete()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])

    class Meta:
        abstract = True
