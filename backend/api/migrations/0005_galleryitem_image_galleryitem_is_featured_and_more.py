from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0004_remove_organizationprofile_favicon_icon"),
    ]

    operations = [
        migrations.AddField(
            model_name="galleryitem",
            name="image",
            field=models.ImageField(blank=True, null=True, upload_to="gallery/images/"),
        ),
        migrations.AddField(
            model_name="galleryitem",
            name="is_featured",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="galleryitem",
            name="show_in_slider",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="galleryitem",
            name="image_url",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
