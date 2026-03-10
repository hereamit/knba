from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import ContactSubmission, Event, GalleryItem, HeroSlide, MemberProfile, ServiceItem, SiteSettings
from .serializers import (
    ContactSubmissionCreateSerializer,
    ContactSubmissionSerializer,
    CurrentUserSerializer,
    EventSerializer,
    GalleryItemSerializer,
    HeroSlideSerializer,
    LoginSerializer,
    MemberProfileSerializer,
    ServiceItemSerializer,
    SiteSettingsSerializer,
)


class PublicReadAdminWriteViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            return queryset
        if hasattr(queryset.model, "is_active"):
            return queryset.filter(is_active=True)
        return queryset


class HealthCheckView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        return Response({"status": "ok", "service": "knba-api"})


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class CurrentUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)


class SiteSettingsView(APIView):
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_object(self):
        settings = SiteSettings.objects.order_by("id").first()
        if settings is None:
            settings = SiteSettings.objects.create()
        return settings

    def get(self, request):
        serializer = SiteSettingsSerializer(self.get_object())
        return Response(serializer.data)

    def patch(self, request):
        instance = self.get_object()
        serializer = SiteSettingsSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def put(self, request):
        instance = self.get_object()
        serializer = SiteSettingsSerializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class HeroSlideViewSet(PublicReadAdminWriteViewSet):
    queryset = HeroSlide.objects.all()
    serializer_class = HeroSlideSerializer


class ServiceItemViewSet(PublicReadAdminWriteViewSet):
    queryset = ServiceItem.objects.all()
    serializer_class = ServiceItemSerializer


class MemberProfileViewSet(PublicReadAdminWriteViewSet):
    queryset = MemberProfile.objects.all()
    serializer_class = MemberProfileSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)
        return queryset


class GalleryItemViewSet(PublicReadAdminWriteViewSet):
    queryset = GalleryItem.objects.all()
    serializer_class = GalleryItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category__iexact=category)
        return queryset


class EventViewSet(PublicReadAdminWriteViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer


class ContactSubmissionViewSet(viewsets.ModelViewSet):
    queryset = ContactSubmission.objects.all()
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return ContactSubmissionCreateSerializer
        return ContactSubmissionSerializer

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def unread_count(self, request):
        unread = ContactSubmission.objects.filter(is_read=False).count()
        return Response({"unread": unread})


class DashboardSummaryView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        recent_messages = ContactSubmission.objects.all()[:5]
        message_data = ContactSubmissionSerializer(recent_messages, many=True).data
        category_breakdown = list(
            MemberProfile.objects.filter(is_active=True)
            .values("category")
            .annotate(total=Count("id"))
            .order_by("category")
        )
        return Response(
            {
                "metrics": {
                    "members": MemberProfile.objects.filter(is_active=True).count(),
                    "events": Event.objects.filter(is_active=True).count(),
                    "gallery_items": GalleryItem.objects.filter(is_active=True).count(),
                    "unread_messages": ContactSubmission.objects.filter(is_read=False).count(),
                },
                "member_breakdown": category_breakdown,
                "recent_messages": message_data,
            },
            status=status.HTTP_200_OK,
        )


token_refresh_view = TokenRefreshView.as_view()
