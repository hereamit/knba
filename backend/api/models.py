import os
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import models
from PIL import Image, ImageOps


def optimize_uploaded_image(image_field, *, max_dimension=2200, jpeg_quality=84):
    if not image_field:
        return

    try:
        image_field.seek(0)
        with Image.open(image_field) as source_image:
            normalized_image = ImageOps.exif_transpose(source_image)
            if max(normalized_image.size) > max_dimension:
                normalized_image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

            output = BytesIO()
            original_name = image_field.name or "upload.jpg"
            base_name, original_extension = os.path.splitext(original_name)
            normalized_extension = original_extension.lower()

            save_kwargs: dict[str, object] = {}
            target_extension = normalized_extension or ".jpg"

            if normalized_extension in {".jpg", ".jpeg"}:
                if normalized_image.mode not in {"RGB", "L"}:
                    normalized_image = normalized_image.convert("RGB")
                target_format = "JPEG"
                target_extension = ".jpg"
                save_kwargs = {
                    "format": target_format,
                    "quality": jpeg_quality,
                    "optimize": True,
                    "progressive": True,
                }
            elif normalized_extension == ".png":
                target_format = "PNG"
                save_kwargs = {
                    "format": target_format,
                    "optimize": True,
                }
            elif normalized_extension == ".webp":
                if normalized_image.mode not in {"RGB", "RGBA"}:
                    normalized_image = normalized_image.convert("RGBA")
                target_format = "WEBP"
                target_extension = ".webp"
                save_kwargs = {
                    "format": target_format,
                    "quality": jpeg_quality,
                    "method": 6,
                }
            else:
                if normalized_image.mode not in {"RGB", "L"}:
                    normalized_image = normalized_image.convert("RGB")
                target_format = "JPEG"
                target_extension = ".jpg"
                save_kwargs = {
                    "format": target_format,
                    "quality": jpeg_quality,
                    "optimize": True,
                    "progressive": True,
                }

            normalized_image.save(output, **save_kwargs)
            output.seek(0)
            image_field.save(
                f"{base_name}{target_extension}",
                ContentFile(output.read()),
                save=False,
            )
    except Exception:
        # Keep the original upload if optimization fails.
        return


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
    about_eyebrow = models.CharField(max_length=80, default="About Us")
    about_title = models.CharField(
        max_length=255,
        default="Who we are and what KNBA stands for.",
    )
    about_quote = models.TextField(
        default=(
            "Together, the merchants of Khichapokhari and New Road can shape a "
            "market that's organized, fair, and worthy of its history."
        )
    )
    about_quote_label = models.CharField(max_length=80, default="Founding Vision")
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
    member_submissions_open = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "Site settings"

    def __str__(self) -> str:
        return self.short_name


class OrganizationProfile(TimeStampedModel):
    organization_name = models.CharField(
        max_length=255, default="Khichapokhari Newroad Business Association"
    )
    short_name = models.CharField(max_length=50, default="KNBA")
    office_address = models.CharField(
        max_length=255, default="Khichapokhari, New Road, Kathmandu"
    )
    phone_number = models.CharField(max_length=50, default="+977-1-5350000")
    email = models.EmailField(default="secretariat@knba.org.np")
    logo = models.ImageField(upload_to="organization/logos/", blank=True, null=True)
    map_embed_url = models.TextField(blank=True)
    is_active = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Organization profile"
        verbose_name_plural = "Organization profile"
        ordering = ("-is_active", "-updated_at", "organization_name", "id")

    def __str__(self) -> str:
        return self.organization_name

    def save(self, *args, **kwargs):
        optimize_uploaded_image(self.logo)
        super().save(*args, **kwargs)


class EmergencyNotice(TimeStampedModel):
    label = models.CharField(max_length=120, default="Emergency Notice")
    message = models.TextField(
        default=(
            "For urgent market coordination, safety concerns, or service disruption "
            "updates, contact the KNBA secretariat immediately."
        )
    )
    button_label = models.CharField(max_length=80, default="View Notice")
    pdf = models.FileField(upload_to="emergency-notices/pdfs/", blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("-is_active", "-updated_at", "-created_at", "-id")

    def __str__(self) -> str:
        return self.label


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


class CommitteeTerm(TimeStampedModel):
    label = models.CharField(max_length=120, blank=True)
    start_year = models.PositiveSmallIntegerField()
    end_year = models.PositiveSmallIntegerField()
    display_order = models.PositiveIntegerField(default=0)
    is_current = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("-is_current", "display_order", "-start_year", "id")

    def __str__(self) -> str:
        return self.label or f"{self.start_year}-{self.end_year}"

    def save(self, *args, **kwargs):
        if not self.label:
            self.label = f"{self.start_year}-{self.end_year}"
        super().save(*args, **kwargs)


class MemberProfile(TimeStampedModel):
    class Category(models.TextChoices):
        LEADERSHIP = "leadership", "Leadership"
        EXECUTIVE = "executive", "Executive Committee"
        ADVISORY = "advisory", "Advisory Panel"

    term = models.ForeignKey(
        CommitteeTerm,
        related_name="members",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=32, choices=Category.choices)
    role = models.CharField(max_length=120)
    phone = models.CharField(max_length=50)
    email = models.EmailField()
    note = models.CharField(max_length=255, blank=True)
    photo = models.ImageField(upload_to="members/photos/", blank=True, null=True)
    photo_url = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("term__display_order", "display_order", "id")

    def __str__(self) -> str:
        return f"{self.name} ({self.role})"

    def save(self, *args, **kwargs):
        optimize_uploaded_image(self.photo)
        super().save(*args, **kwargs)


class GeneralMember(TimeStampedModel):
    business_name = models.CharField(max_length=180)
    contact_person = models.CharField(max_length=120)
    category = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=50)
    email = models.EmailField(blank=True)
    office_address = models.CharField(max_length=255, blank=True)
    joined_date = models.DateField(blank=True, null=True)
    note = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("business_name", "contact_person", "id")

    def __str__(self) -> str:
        return self.business_name


class GalleryItem(TimeStampedModel):
    title = models.CharField(max_length=160)
    category = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="gallery/images/", blank=True, null=True)
    image_url = models.CharField(max_length=255, blank=True)
    is_featured = models.BooleanField(default=False)
    show_in_slider = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("display_order", "id")

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        optimize_uploaded_image(self.image)
        super().save(*args, **kwargs)


class BusinessShowcaseItem(TimeStampedModel):
    name = models.CharField(max_length=180)
    category = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=50)
    address = models.CharField(max_length=255)
    image = models.ImageField(upload_to="business-showcase/images/", blank=True, null=True)
    image_url = models.CharField(max_length=255, blank=True)
    badge = models.CharField(max_length=80, default="Business Showcase")
    website_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    ecommerce_url = models.URLField(blank=True)
    is_featured = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("display_order", "name", "id")

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        optimize_uploaded_image(self.image)
        super().save(*args, **kwargs)


class BusinessShowcaseSubmission(TimeStampedModel):
    class ReviewStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    submitter_name = models.CharField(max_length=120)
    submitter_email = models.EmailField()
    name = models.CharField(max_length=180)
    category = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=50)
    address = models.CharField(max_length=255)
    image = models.ImageField(upload_to="business-showcase/submissions/", blank=True, null=True)
    image_url = models.CharField(max_length=255, blank=True)
    badge = models.CharField(max_length=80, default="Business Showcase")
    website_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    ecommerce_url = models.URLField(blank=True)
    is_featured = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    is_read = models.BooleanField(default=False)
    review_status = models.CharField(
        max_length=20,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING,
    )
    admin_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    published_item = models.ForeignKey(
        BusinessShowcaseItem,
        on_delete=models.SET_NULL,
        related_name="source_submissions",
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ("-created_at", "id")

    def __str__(self) -> str:
        return f"{self.name} ({self.get_review_status_display()})"

    def save(self, *args, **kwargs):
        optimize_uploaded_image(self.image)
        super().save(*args, **kwargs)


class MemberSubmission(TimeStampedModel):
    class ReviewStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    submitter_name = models.CharField(max_length=120)
    submitter_email = models.EmailField()
    submitter_phone = models.CharField(max_length=50, blank=True)
    name = models.CharField(max_length=120)
    role = models.CharField(max_length=120)
    category = models.CharField(
        max_length=32,
        choices=MemberProfile.Category.choices,
        default=MemberProfile.Category.EXECUTIVE,
    )
    phone = models.CharField(max_length=50)
    email = models.EmailField()
    note = models.CharField(max_length=255, blank=True)
    photo = models.ImageField(upload_to="members/submissions/", blank=True, null=True)
    is_read = models.BooleanField(default=False)
    review_status = models.CharField(
        max_length=20,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING,
    )
    admin_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    published_member = models.ForeignKey(
        MemberProfile,
        on_delete=models.SET_NULL,
        related_name="source_submissions",
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ("-created_at", "id")

    def __str__(self) -> str:
        return f"{self.name} ({self.get_review_status_display()})"

    def save(self, *args, **kwargs):
        optimize_uploaded_image(self.photo)
        super().save(*args, **kwargs)


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


class ContactReply(TimeStampedModel):
    class DeliveryStatus(models.TextChoices):
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    submission = models.ForeignKey(
        ContactSubmission,
        related_name="replies",
        on_delete=models.CASCADE,
    )
    subject = models.CharField(max_length=200)
    body = models.TextField()
    recipient_email = models.EmailField()
    attachment = models.FileField(upload_to="contact-replies/attachments/", blank=True, null=True)
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="contact_replies",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    delivery_status = models.CharField(
        max_length=20,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.SENT,
    )
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ("-created_at", "id")

    def __str__(self) -> str:
        return f"{self.recipient_email} - {self.subject}"

    def delete(self, *args, **kwargs):
        if self.attachment:
            self.attachment.delete(save=False)
        super().delete(*args, **kwargs)
