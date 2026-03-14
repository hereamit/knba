from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0005_galleryitem_image_galleryitem_is_featured_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="BusinessShowcaseItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=180)),
                ("category", models.CharField(max_length=120)),
                ("description", models.TextField(blank=True)),
                ("phone", models.CharField(max_length=50)),
                ("address", models.CharField(max_length=255)),
                ("image", models.ImageField(blank=True, null=True, upload_to="business-showcase/images/")),
                ("image_url", models.CharField(blank=True, max_length=255)),
                ("badge", models.CharField(default="Business Showcase", max_length=80)),
                ("website_url", models.URLField(blank=True)),
                ("facebook_url", models.URLField(blank=True)),
                ("instagram_url", models.URLField(blank=True)),
                ("ecommerce_url", models.URLField(blank=True)),
                ("is_featured", models.BooleanField(default=False)),
                ("display_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={
                "ordering": ("display_order", "name", "id"),
            },
        ),
    ]
