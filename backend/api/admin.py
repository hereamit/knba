from django.contrib import admin

from .models import (
    BusinessShowcaseItem,
    BusinessShowcaseSubmission,
    CommitteeTerm,
    ContactReply,
    ContactSubmission,
    EmergencyNotice,
    Event,
    GeneralMember,
    GalleryItem,
    HeroSlide,
    MemberProfile,
    MemberSubmission,
    OrganizationProfile,
    ServiceItem,
    SiteSettings,
)


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ("short_name", "office_phone", "office_email", "updated_at")


@admin.register(OrganizationProfile)
class OrganizationProfileAdmin(admin.ModelAdmin):
    list_display = (
        "short_name",
        "organization_name",
        "phone_number",
        "email",
        "is_active",
        "updated_at",
    )


@admin.register(EmergencyNotice)
class EmergencyNoticeAdmin(admin.ModelAdmin):
    list_display = ("label", "button_label", "is_active", "updated_at")
    list_filter = ("is_active", "updated_at")
    search_fields = ("label", "message", "button_label")


@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ("title", "display_order", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("title", "short_title")


@admin.register(ServiceItem)
class ServiceItemAdmin(admin.ModelAdmin):
    list_display = ("title", "tag", "display_order", "is_active")
    list_filter = ("is_active", "tag")
    search_fields = ("title", "description")


@admin.register(CommitteeTerm)
class CommitteeTermAdmin(admin.ModelAdmin):
    list_display = ("label", "start_year", "end_year", "display_order", "is_current", "is_active")
    list_filter = ("is_current", "is_active")
    search_fields = ("label",)


@admin.register(MemberProfile)
class MemberProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "term", "role", "category", "phone", "email", "display_order", "is_active")
    list_filter = ("term", "category", "is_active")
    search_fields = ("name", "role", "email", "phone")


@admin.register(GeneralMember)
class GeneralMemberAdmin(admin.ModelAdmin):
    list_display = ("business_name", "contact_person", "category", "phone", "email", "joined_date", "is_active")
    list_filter = ("category", "is_active", "joined_date")
    search_fields = ("business_name", "contact_person", "phone", "email", "office_address")


@admin.register(GalleryItem)
class GalleryItemAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "is_featured",
        "display_order",
        "is_active",
    )
    list_filter = ("category", "is_featured", "is_active")
    search_fields = ("title", "description")


@admin.register(BusinessShowcaseItem)
class BusinessShowcaseItemAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "badge",
        "is_featured",
        "display_order",
        "is_active",
    )
    list_filter = ("category", "badge", "is_featured", "is_active")
    search_fields = ("name", "category", "phone", "address")


@admin.register(BusinessShowcaseSubmission)
class BusinessShowcaseSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "submitter_name",
        "category",
        "review_status",
        "published_item",
        "created_at",
    )
    list_filter = ("review_status", "category", "created_at")
    search_fields = ("name", "submitter_name", "submitter_email", "phone", "address")


@admin.register(MemberSubmission)
class MemberSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "submitter_name",
        "role",
        "category",
        "review_status",
        "published_member",
        "created_at",
    )
    list_filter = ("review_status", "category", "created_at")
    search_fields = ("name", "submitter_name", "submitter_email", "role", "email", "phone")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "event_date", "venue", "status", "is_active")
    list_filter = ("status", "is_active")
    search_fields = ("title", "venue", "description")


@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ("full_name", "subject", "email", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("full_name", "subject", "email", "message")


@admin.register(ContactReply)
class ContactReplyAdmin(admin.ModelAdmin):
    list_display = ("recipient_email", "subject", "sent_by", "delivery_status", "created_at")
    list_filter = ("delivery_status", "created_at")
    search_fields = ("recipient_email", "subject", "body", "error_message")
