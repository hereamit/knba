from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    ContactSubmission,
    Event,
    GalleryItem,
    HeroSlide,
    MemberProfile,
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
    class Meta:
        model = SiteSettings
        fields = "__all__"


class HeroSlideSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroSlide
        fields = "__all__"


class ServiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceItem
        fields = "__all__"


class MemberProfileSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = MemberProfile
        fields = "__all__"


class GalleryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryItem
        fields = "__all__"


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


class ContactSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = "__all__"
