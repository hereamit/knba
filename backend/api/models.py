from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SiteSettings(TimeStampedModel):
    organization_name = models.CharField(
        max_length=255, default="Khichapokhari Newroad Business Association"
    )
    short_name = models.CharField(max_length=50, default="KNBA")
    office_address = models.CharField(
        max_length=255, default="Khichapokhari, New Road, Kathmandu"
    )
    office_phone = models.CharField(max_length=50, default="+977-1-5350000")
    office_email = models.EmailField(default="secretariat@knba.org.np")
    emergency_label = models.CharField(max_length=120, default="Emergency Notice")
    emergency_message = models.TextField(
        default=(
            "For urgent market coordination, safety concerns, or service disruption "
            "updates, contact the KNBA secretariat immediately."
        )
    )
    emergency_contact = models.CharField(max_length=50, default="+977-1-5350000")
    history_text = models.TextField(blank=True)
    founder_name = models.CharField(max_length=120, blank=True)
    founder_title = models.CharField(max_length=120, blank=True)
    founder_message = models.TextField(blank=True)
    founder_image_url = models.CharField(max_length=255, blank=True)
    president_name = models.CharField(max_length=120, blank=True)
    president_title = models.CharField(max_length=120, blank=True)
    president_message = models.TextField(blank=True)
    president_image_url = models.CharField(max_length=255, blank=True)
    mission_text = models.TextField(blank=True)
    vision_text = models.TextField(blank=True)
    map_embed_url = models.TextField(blank=True)
    social_links = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name_plural = "Site settings"

    def __str__(self) -> str:
        return self.short_name


class HeroSlide(TimeStampedModel):
    eyebrow = models.CharField(max_length=120, blank=True)
    title = models.CharField(max_length=255)
    short_title = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    feature = models.CharField(max_length=255, blank=True)
    image_url = models.CharField(max_length=255)
    credit = models.CharField(max_length=255, blank=True)
    primary_label = models.CharField(max_length=80, blank=True)
    primary_href = models.CharField(max_length=160, blank=True)
    secondary_label = models.CharField(max_length=80, blank=True)
    secondary_href = models.CharField(max_length=160, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("display_order", "id")

    def __str__(self) -> str:
        return self.short_title or self.title


class ServiceItem(TimeStampedModel):
    tag = models.CharField(max_length=80)
    title = models.CharField(max_length=255)
    description = models.TextField()
    points = models.JSONField(default=list, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("display_order", "id")

    def __str__(self) -> str:
        return self.title


class MemberProfile(TimeStampedModel):
    class Category(models.TextChoices):
        PRESIDENT = "president", "President"
        VICE_PRESIDENT = "vice_president", "Vice-President"
        SECRETARIAT = "secretariat", "Secretariat"
        ADVISORY = "advisory", "Advisory"
        MEMBER = "member", "Member"

    name = models.CharField(max_length=120)
    category = models.CharField(max_length=32, choices=Category.choices)
    role = models.CharField(max_length=120)
    phone = models.CharField(max_length=50)
    email = models.EmailField()
    photo_url = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("display_order", "id")

    def __str__(self) -> str:
        return f"{self.name} ({self.role})"


class GalleryItem(TimeStampedModel):
    title = models.CharField(max_length=160)
    category = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    image_url = models.CharField(max_length=255)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("display_order", "id")

    def __str__(self) -> str:
        return self.title


class Event(TimeStampedModel):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        PLANNING = "planning", "Planning"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"

    title = models.CharField(max_length=180)
    venue = models.CharField(max_length=180)
    event_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    description = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("event_date", "display_order", "id")

    def __str__(self) -> str:
        return self.title


class ContactSubmission(TimeStampedModel):
    full_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    subject = models.CharField(max_length=160)
    message = models.TextField()
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.full_name}: {self.subject}"
