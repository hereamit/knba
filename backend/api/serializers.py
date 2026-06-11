from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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
    HomeHeroImage,
    MemberProfile,
    OrganizationProfile,
    ServiceItem,
    SiteSettings,
)

User = get_user_model()


class CurrentUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "full_name")

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class LoginSerializer(TokenObtainPairSerializer):
    login = serializers.CharField(write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field].required = False

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["name"] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        login = attrs.get("login", "").strip()
        try:
            user = User.objects.get(
                Q(username__iexact=login) | Q(email__iexact=login),
                is_active=True,
            )
        except User.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"detail": "No active account found with the provided credentials."}
            ) from exc

        attrs["username"] = user.get_username()
        data = super().validate(attrs)
        data["user"] = CurrentUserSerializer(self.user).data
        return data


class SiteSettingsSerializer(serializers.ModelSerializer):
    calendar_pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = SiteSettings
        fields = "__all__"

    def get_calendar_pdf_url(self, obj):
        request = self.context.get("request")
        if obj.calendar_pdf:
            if request is not None:
                return request.build_absolute_uri(obj.calendar_pdf.url)
            return obj.calendar_pdf.url
        return ""

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request is not None and request.data.get("calendar_pdf_clear") in {"1", "true", "True"}:
            if instance.calendar_pdf:
                instance.calendar_pdf.delete(save=False)
            instance.calendar_pdf = None

        return super().update(instance, validated_data)


class OrganizationProfileSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationProfile
        fields = (
            "id",
            "organization_name",
            "short_name",
            "office_address",
            "phone_number",
            "email",
            "logo",
            "logo_url",
            "map_embed_url",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def _build_media_url(self, file_field):
        if not file_field:
            return ""

        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(file_field.url)

        return file_field.url

    def get_logo_url(self, obj):
        return self._build_media_url(obj.logo)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request is not None:
            if request.data.get("logo_clear") in {"1", "true", "True"}:
                if instance.logo:
                    instance.logo.delete(save=False)
                instance.logo = None

        return super().update(instance, validated_data)


class EmergencyNoticeSerializer(serializers.ModelSerializer):
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = EmergencyNotice
        fields = (
            "id",
            "label",
            "message",
            "button_label",
            "pdf",
            "pdf_url",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_pdf_url(self, obj):
        request = self.context.get("request")
        if obj.pdf:
            if request is not None:
                return request.build_absolute_uri(obj.pdf.url)
            return obj.pdf.url
        return ""

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request is not None and request.data.get("pdf_clear") in {"1", "true", "True"}:
            if instance.pdf:
                instance.pdf.delete(save=False)
            instance.pdf = None

        return super().update(instance, validated_data)


class HeroSlideSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroSlide
        fields = "__all__"


class HomeHeroImageSerializer(serializers.ModelSerializer):
    image_src = serializers.SerializerMethodField()

    class Meta:
        model = HomeHeroImage
        fields = (
            "id",
            "title",
            "image",
            "image_url",
            "image_src",
            "display_order",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_image_src(self, obj):
        request = self.context.get("request")
        if obj.image:
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url


class ServiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceItem
        fields = "__all__"


class CommitteeTermSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CommitteeTerm
        fields = (
            "id",
            "label",
            "start_year",
            "end_year",
            "display_order",
            "is_current",
            "is_active",
            "member_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "member_count", "created_at", "updated_at")

    def validate(self, attrs):
        start_year = attrs.get("start_year", getattr(self.instance, "start_year", None))
        end_year = attrs.get("end_year", getattr(self.instance, "end_year", None))

        if start_year is not None and end_year is not None and end_year <= start_year:
            raise serializers.ValidationError(
                {"end_year": "End year must be greater than start year."}
            )

        if not attrs.get("label") and start_year is not None and end_year is not None:
            attrs["label"] = f"{start_year}-{end_year}"

        return attrs


class MemberProfileSerializer(serializers.ModelSerializer):
    category_label = serializers.SerializerMethodField()
    photo_src = serializers.SerializerMethodField()
    term_label = serializers.CharField(source="term.label", read_only=True)
    term_start_year = serializers.IntegerField(source="term.start_year", read_only=True)
    term_end_year = serializers.IntegerField(source="term.end_year", read_only=True)

    class Meta:
        model = MemberProfile
        fields = (
            "id",
            "term",
            "term_label",
            "term_start_year",
            "term_end_year",
            "name",
            "category",
            "category_label",
            "role",
            "phone",
            "email",
            "note",
            "photo",
            "photo_url",
            "photo_src",
            "display_order",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        term = attrs.get("term", getattr(self.instance, "term", None))
        if term is None:
            raise serializers.ValidationError({"term": "Term is required."})
        return attrs

    def get_photo_src(self, obj):
        request = self.context.get("request")
        if obj.photo:
            if request is not None:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return obj.photo_url

    def get_category_label(self, obj):
        return obj.get_category_display()

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request is not None and request.data.get("photo_clear") in {"1", "true", "True"}:
            if instance.photo:
                instance.photo.delete(save=False)
            instance.photo = None

        return super().update(instance, validated_data)


class GeneralMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneralMember
        fields = (
            "id",
            "business_name",
            "contact_person",
            "category",
            "phone",
            "email",
            "office_address",
            "joined_date",
            "note",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class GalleryItemSerializer(serializers.ModelSerializer):
    image_src = serializers.SerializerMethodField()

    class Meta:
        model = GalleryItem
        fields = (
            "id",
            "title",
            "category",
            "description",
            "image",
            "image_url",
            "image_src",
            "is_featured",
            "display_order",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_image_src(self, obj):
        request = self.context.get("request")
        if obj.image:
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url

    def validate(self, attrs):
        category = attrs.get("category", getattr(self.instance, "category", "")).strip()
        display_order = attrs.get(
            "display_order",
            getattr(self.instance, "display_order", None),
        )

        if category and display_order is not None:
            queryset = GalleryItem.objects.filter(
                category__iexact=category,
                display_order=display_order,
            )
            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)

            if queryset.exists():
                raise serializers.ValidationError(
                    {
                        "display_order": (
                            f'Display order "{display_order}" is already used in the '
                            f'"{category}" category.'
                        )
                    }
                )

        return attrs

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request is not None and request.data.get("image_clear") in {"1", "true", "True"}:
            if instance.image:
                instance.image.delete(save=False)
            instance.image = None

        return super().update(instance, validated_data)


class BusinessShowcaseItemSerializer(serializers.ModelSerializer):
    image_src = serializers.SerializerMethodField()

    class Meta:
        model = BusinessShowcaseItem
        fields = (
            "id",
            "name",
            "category",
            "description",
            "phone",
            "address",
            "image",
            "image_url",
            "image_src",
            "badge",
            "website_url",
            "facebook_url",
            "instagram_url",
            "ecommerce_url",
            "is_featured",
            "display_order",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_image_src(self, obj):
        request = self.context.get("request")
        if obj.image:
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request is not None and request.data.get("image_clear") in {"1", "true", "True"}:
            if instance.image:
                instance.image.delete(save=False)
            instance.image = None

        return super().update(instance, validated_data)


class BusinessShowcaseSubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessShowcaseSubmission
        fields = (
            "id",
            "submitter_name",
            "submitter_email",
            "name",
            "category",
            "description",
            "phone",
            "address",
            "image",
            "badge",
            "website_url",
            "facebook_url",
            "instagram_url",
            "ecommerce_url",
            "review_status",
            "created_at",
        )
        read_only_fields = ("id", "badge", "review_status", "created_at")


class BusinessShowcaseSubmissionSerializer(serializers.ModelSerializer):
    image_src = serializers.SerializerMethodField()

    class Meta:
        model = BusinessShowcaseSubmission
        fields = (
            "id",
            "submitter_name",
            "submitter_email",
            "name",
            "category",
            "description",
            "phone",
            "address",
            "image",
            "image_url",
            "image_src",
            "badge",
            "website_url",
            "facebook_url",
            "instagram_url",
            "ecommerce_url",
            "is_featured",
            "display_order",
            "is_read",
            "review_status",
            "admin_notes",
            "reviewed_at",
            "published_item",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "reviewed_at", "published_item")

    def get_image_src(self, obj):
        request = self.context.get("request")
        if obj.image:
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request is not None and request.data.get("image_clear") in {"1", "true", "True"}:
            if instance.image:
                instance.image.delete(save=False)
            instance.image = None

        return super().update(instance, validated_data)


class EventSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Event
        fields = "__all__"


class ContactSubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = ("id", "full_name", "email", "phone", "subject", "message", "created_at")
        read_only_fields = ("id", "created_at")


class ContactReplySerializer(serializers.ModelSerializer):
    sent_by_name = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()

    class Meta:
        model = ContactReply
        fields = (
            "id",
            "subject",
            "body",
            "recipient_email",
            "attachment",
            "attachment_url",
            "attachment_name",
            "sent_by",
            "sent_by_name",
            "delivery_status",
            "error_message",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_sent_by_name(self, obj):
        if not obj.sent_by:
            return ""
        return obj.sent_by.get_full_name() or obj.sent_by.get_username()

    def get_attachment_url(self, obj):
        request = self.context.get("request")
        if obj.attachment:
            if request is not None:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return ""

    def get_attachment_name(self, obj):
        if not obj.attachment:
            return ""
        return obj.attachment.name.rsplit("/", 1)[-1]


class ContactSubmissionSerializer(serializers.ModelSerializer):
    replies = ContactReplySerializer(many=True, read_only=True)

    class Meta:
        model = ContactSubmission
        fields = "__all__"
