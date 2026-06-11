from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0016_homeheroimage"),
    ]

    operations = [
        migrations.AlterField(
            model_name="businessshowcaseitem",
            name="phone",
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name="businessshowcasesubmission",
            name="phone",
            field=models.CharField(max_length=150),
        ),
    ]
