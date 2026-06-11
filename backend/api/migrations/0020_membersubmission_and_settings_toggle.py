import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0019_remove_galleryitem_show_in_slider"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="member_submissions_open",
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name="MemberSubmission",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("submitter_name", models.CharField(max_length=120)),
                ("submitter_email", models.EmailField(max_length=254)),
                ("submitter_phone", models.CharField(blank=True, max_length=50)),
                ("name", models.CharField(max_length=120)),
                ("role", models.CharField(max_length=120)),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("leadership", "Leadership"),
                            ("executive", "Executive Committee"),
                            ("advisory", "Advisory Panel"),
                        ],
                        default="executive",
                        max_length=32,
                    ),
                ),
                ("phone", models.CharField(max_length=50)),
                ("email", models.EmailField(max_length=254)),
                ("note", models.CharField(blank=True, max_length=255)),
                ("photo", models.ImageField(blank=True, null=True, upload_to="members/submissions/")),
                ("is_read", models.BooleanField(default=False)),
                (
                    "review_status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("admin_notes", models.TextField(blank=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "published_member",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="source_submissions",
                        to="api.memberprofile",
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at", "id"),
            },
        ),
    ]
