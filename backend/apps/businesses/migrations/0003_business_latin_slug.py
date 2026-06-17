import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('businesses', '0002_populate_from_providers'),
    ]

    operations = [
        migrations.AddField(
            model_name='business',
            name='latin_slug',
            field=models.SlugField(
                allow_unicode=False,
                blank=True,
                help_text='آدرس اختصاصی انگلیسی صفحه رزرو: nobatic.ir/book/{latin_slug}',
                max_length=80,
                null=True,
                unique=True,
                validators=[
                    django.core.validators.RegexValidator(
                        message='آدرس اختصاصی فقط می‌تواند شامل حروف انگلیسی کوچک، اعداد و خط‌فاصله باشد.',
                        regex='^[a-z0-9-]+$',
                    )
                ],
                verbose_name='آدرس اختصاصی (لاتین)',
            ),
        ),
        migrations.AddIndex(
            model_name='business',
            index=models.Index(fields=['latin_slug'], name='businesses_latin_s_3ad52d_idx'),
        ),
    ]
