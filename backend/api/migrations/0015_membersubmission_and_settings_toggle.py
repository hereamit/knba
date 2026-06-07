from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0014_contactreply_attachment"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="member_submissions_open",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="about_eyebrow",
            field=models.CharField(default="About Us", max_length=80),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="about_title",
            field=models.CharField(
                default="Who we are and what KNBA stands for.",
                max_length=255,
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="about_quote",
            field=models.TextField(
                default=(
                    "Together, the merchants of Khichapokhari and New Road can shape a "
                    "market that's organized, fair, and worthy of its history."
                )
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="about_quote_label",
            field=models.CharField(default="Founding Vision", max_length=80),
        ),
        migrations.CreateModel(
            name="MemberSubmission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
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
                        on_delete=models.deletion.SET_NULL,
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
