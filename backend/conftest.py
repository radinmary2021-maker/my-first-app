import pytest


@pytest.fixture(autouse=True, scope='session')
def celery_eager(django_db_setup):
    """Force all Celery tasks to run synchronously during the test session."""
    from config.celery import app
    app.conf.update(task_always_eager=True, task_eager_propagates=False)
