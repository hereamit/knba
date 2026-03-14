from django.db.models import Count, Max
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import (
    BusinessShowcaseItem,
    BusinessShowcaseSubmission,
    CommitteeTerm,
    ContactSubmission,
    Event,
    GalleryItem,
    HeroSlide,
    MemberProfile,
    OrganizationProfile,
    ServiceItem,
    SiteSettings,
)
from .serializers import (
    BusinessShowcaseItemSerializer,
    BusinessShowcaseSubmissionCreateSerializer,
    BusinessShowcaseSubmissionSerializer,
    CommitteeTermSerializer,
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
    OrganizationProfileSerializer,
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


class OrganizationProfileViewSet(PublicReadAdminWriteViewSet):
    queryset = OrganizationProfile.objects.all()
    serializer_class = OrganizationProfileSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            return queryset
        active_queryset = queryset.filter(is_active=True)
        return active_queryset if active_queryset.exists() else queryset[:1]

    def _sync_active_profile(self, instance):
        if instance.is_active:
            OrganizationProfile.objects.exclude(pk=instance.pk).update(is_active=False)

    def perform_create(self, serializer):
        instance = serializer.save()
        self._sync_active_profile(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._sync_active_profile(instance)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def current(self, request):
        profile = (
            OrganizationProfile.objects.filter(is_active=True).first()
            or OrganizationProfile.objects.order_by("-updated_at", "id").first()
        )
        if profile is None:
            return Response({}, status=status.HTTP_200_OK)

        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def activate(self, request, pk=None):
        profile = self.get_object()
        OrganizationProfile.objects.update(is_active=False)
        profile.is_active = True
        profile.save(update_fields=["is_active", "updated_at"])
        serializer = self.get_serializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HeroSlideViewSet(PublicReadAdminWriteViewSet):
    queryset = HeroSlide.objects.all()
    serializer_class = HeroSlideSerializer


class ServiceItemViewSet(PublicReadAdminWriteViewSet):
    queryset = ServiceItem.objects.all()
    serializer_class = ServiceItemSerializer


class CommitteeTermViewSet(PublicReadAdminWriteViewSet):
    queryset = CommitteeTerm.objects.all()
    serializer_class = CommitteeTermSerializer

    def get_queryset(self):
        queryset = super().get_queryset().annotate(member_count=Count("members"))
        if self.request.user.is_authenticated:
            return queryset
        return queryset.filter(is_active=True)

    def _sync_current_term(self, instance):
        if instance.is_current:
            CommitteeTerm.objects.exclude(pk=instance.pk).update(is_current=False)

    def perform_create(self, serializer):
        instance = serializer.save()
        self._sync_current_term(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._sync_current_term(instance)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def current(self, request):
        term = (
            CommitteeTerm.objects.filter(is_current=True, is_active=True).first()
            or CommitteeTerm.objects.filter(is_active=True).order_by("display_order", "-start_year", "id").first()
        )
        if term is None:
            return Response({}, status=status.HTTP_200_OK)
        serializer = self.get_serializer(term)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def activate(self, request, pk=None):
        term = self.get_object()
        CommitteeTerm.objects.update(is_current=False)
        term.is_current = True
        term.save(update_fields=["is_current", "updated_at"])
        serializer = self.get_serializer(term)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MemberProfileViewSet(PublicReadAdminWriteViewSet):
    queryset = MemberProfile.objects.select_related("term").all()
    serializer_class = MemberProfileSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        queryset = super().get_queryset()
        term = self.request.query_params.get("term")
        category = self.request.query_params.get("category")
        if term:
            queryset = queryset.filter(term_id=term)
        elif not self.request.user.is_authenticated:
            current_term = (
                CommitteeTerm.objects.filter(is_current=True, is_active=True).first()
                or CommitteeTerm.objects.filter(is_active=True).order_by("display_order", "-start_year", "id").first()
            )
            if current_term is not None:
                queryset = queryset.filter(term=current_term)
        if category:
            queryset = queryset.filter(category=category)
        return queryset


class GalleryItemViewSet(PublicReadAdminWriteViewSet):
    queryset = GalleryItem.objects.all()
    serializer_class = GalleryItemSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")
        featured = self.request.query_params.get("featured")
        slider = self.request.query_params.get("slider")
        if category:
            queryset = queryset.filter(category__iexact=category)
        if featured in {"1", "true", "True"}:
            queryset = queryset.filter(is_featured=True)
        if slider in {"1", "true", "True"}:
            queryset = queryset.filter(show_in_slider=True)
        return queryset


class BusinessShowcaseItemViewSet(PublicReadAdminWriteViewSet):
    queryset = BusinessShowcaseItem.objects.all()
    serializer_class = BusinessShowcaseItemSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")
        featured = self.request.query_params.get("featured")
        if category:
            queryset = queryset.filter(category__iexact=category)
        if featured in {"1", "true", "True"}:
            queryset = queryset.filter(is_featured=True)
        return queryset


class BusinessShowcaseSubmissionViewSet(viewsets.ModelViewSet):
    queryset = BusinessShowcaseSubmission.objects.select_related("published_item").all()
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        review_status = self.request.query_params.get("status")
        if review_status:
            queryset = queryset.filter(review_status=review_status)
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return BusinessShowcaseSubmissionCreateSerializer
        return BusinessShowcaseSubmissionSerializer

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        submission = self.get_object()

        approved_name = str(request.data.get("name", submission.name)).strip() or submission.name
        approved_category = (
            str(request.data.get("category", submission.category)).strip() or submission.category
        )
        approved_description = str(
            request.data.get("description", submission.description)
        ).strip()
        approved_phone = str(request.data.get("phone", submission.phone)).strip() or submission.phone
        approved_address = (
            str(request.data.get("address", submission.address)).strip() or submission.address
        )
        approved_badge = str(request.data.get("badge", submission.badge)).strip() or submission.badge
        approved_website_url = str(
            request.data.get("website_url", submission.website_url)
        ).strip()
        approved_facebook_url = str(
            request.data.get("facebook_url", submission.facebook_url)
        ).strip()
        approved_instagram_url = str(
            request.data.get("instagram_url", submission.instagram_url)
        ).strip()
        approved_ecommerce_url = str(
            request.data.get("ecommerce_url", submission.ecommerce_url)
        ).strip()
        approved_is_featured = str(
            request.data.get("is_featured", submission.is_featured)
        ).lower() in {"1", "true", "yes", "on"}
        display_order = request.data.get("display_order", submission.display_order)
        try:
            display_order = int(display_order)
        except (TypeError, ValueError):
            display_order = submission.display_order

        if display_order <= 0:
            display_order = (
                BusinessShowcaseItem.objects.filter(category__iexact=approved_category).aggregate(
                    max_order=Max("display_order")
                )["max_order"]
                or 0
            )

        if submission.published_item_id:
            published_item = submission.published_item
            published_item.name = approved_name
            published_item.category = approved_category
            published_item.description = approved_description
            published_item.phone = approved_phone
            published_item.address = approved_address
            published_item.badge = approved_badge
            published_item.website_url = approved_website_url
            published_item.facebook_url = approved_facebook_url
            published_item.instagram_url = approved_instagram_url
            published_item.ecommerce_url = approved_ecommerce_url
            published_item.is_featured = approved_is_featured
            published_item.display_order = display_order
            published_item.is_active = True
            published_item.save()
        else:
            published_item = BusinessShowcaseItem.objects.create(
                name=approved_name,
                category=approved_category,
                description=approved_description,
                phone=approved_phone,
                address=approved_address,
                image=submission.image if submission.image else None,
                image_url=submission.image_url,
                badge=approved_badge,
                website_url=approved_website_url,
                facebook_url=approved_facebook_url,
                instagram_url=approved_instagram_url,
                ecommerce_url=approved_ecommerce_url,
                is_featured=approved_is_featured,
                display_order=display_order,
                is_active=True,
            )

        submission.name = approved_name
        submission.category = approved_category
        submission.description = approved_description
        submission.phone = approved_phone
        submission.address = approved_address
        submission.badge = approved_badge
        submission.website_url = approved_website_url
        submission.facebook_url = approved_facebook_url
        submission.instagram_url = approved_instagram_url
        submission.ecommerce_url = approved_ecommerce_url
        submission.is_featured = approved_is_featured
        submission.display_order = display_order
        admin_notes = str(request.data.get("admin_notes", "")).strip()
        submission.review_status = BusinessShowcaseSubmission.ReviewStatus.APPROVED
        submission.reviewed_at = timezone.now()
        submission.published_item = published_item
        if admin_notes:
            submission.admin_notes = admin_notes
        submission.save(
            update_fields=[
                "name",
                "category",
                "description",
                "phone",
                "address",
                "badge",
                "website_url",
                "facebook_url",
                "instagram_url",
                "ecommerce_url",
                "is_featured",
                "display_order",
                "review_status",
                "reviewed_at",
                "published_item",
                "admin_notes",
                "updated_at",
            ]
        )

        serializer = self.get_serializer(submission)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        submission = self.get_object()
        if submission.published_item_id:
            return Response(
                {"detail": "Published submissions cannot be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin_notes = str(request.data.get("admin_notes", "")).strip()
        submission.review_status = BusinessShowcaseSubmission.ReviewStatus.REJECTED
        submission.reviewed_at = timezone.now()
        submission.admin_notes = admin_notes
        submission.save(
            update_fields=[
                "review_status",
                "reviewed_at",
                "admin_notes",
                "updated_at",
            ]
        )

        serializer = self.get_serializer(submission)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
