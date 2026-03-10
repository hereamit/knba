from django.contrib import admin

from .models import (
    ContactSubmission,
    Event,
    GalleryItem,
    HeroSlide,
    MemberProfile,
    ServiceItem,
    SiteSettings,
)


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ("short_name", "office_phone", "office_email", "updated_at")


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


@admin.register(MemberProfile)
class MemberProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "category", "phone", "email", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name", "role", "email")


@admin.register(GalleryItem)
class GalleryItemAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "display_order", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("title", "description")


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
