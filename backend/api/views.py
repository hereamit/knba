from django.core.mail import EmailMessage
from django.db.models import Count, Max
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .member_role_caps import get_role_cap, role_full_message
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
    MemberSubmission,
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
    ContactReplySerializer,
    ContactSubmissionSerializer,
    CurrentUserSerializer,
    EmergencyNoticeSerializer,
    EventSerializer,
    GeneralMemberSerializer,
    GalleryItemSerializer,
    HeroSlideSerializer,
    HomeHeroImageSerializer,
    LoginSerializer,
    MemberProfileSerializer,
    MemberSubmissionCreateSerializer,
    MemberSubmissionSerializer,
    ServiceItemSerializer,
    SiteSettingsSerializer,
    OrganizationProfileSerializer,
)

RESERVED_EMAIL_DOMAINS = {
    "example.com",
    "example.org",
    "example.net",
    "invalid",
    "localhost",
    "test",
}


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
    parser_classes = (MultiPartParser, FormParser, JSONParser)

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
        serializer = SiteSettingsSerializer(self.get_object(), context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        instance = self.get_object()
        serializer = SiteSettingsSerializer(
            instance, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def put(self, request):
        instance = self.get_object()
        serializer = SiteSettingsSerializer(
            instance, data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AboutPageView(APIView):
    permission_classes = (AllowAny,)

    def _get_settings(self):
        settings = SiteSettings.objects.order_by("id").first()
        if settings is None:
            settings = SiteSettings.objects.create()
        return settings

    def _get_current_term(self):
        return (
            CommitteeTerm.objects.filter(is_current=True, is_active=True).first()
            or CommitteeTerm.objects.filter(is_active=True)
            .order_by("display_order", "-start_year", "id")
            .first()
        )

    def _get_founder_member(self, queryset):
        return (
            queryset.filter(role__iexact="Founder").order_by("display_order", "id").first()
            or queryset.filter(role__iexact="Founding President")
            .order_by("display_order", "id")
            .first()
            or queryset.filter(role__icontains="founder").order_by("display_order", "id").first()
            or queryset.filter(role__icontains="founding").order_by("display_order", "id").first()
        )

    def get(self, request):
        settings = self._get_settings()
        current_term = self._get_current_term()
        members = MemberProfile.objects.filter(is_active=True).select_related("term")

        if current_term is not None:
            members = members.filter(term=current_term)

        committee_member_count = members.count()
        general_member_count = GeneralMember.objects.filter(is_active=True).count()
        founder = self._get_founder_member(members)
        president = members.filter(role__iexact="President").order_by("display_order", "id").first()

        return Response(
            {
                "settings": SiteSettingsSerializer(settings, context={"request": request}).data,
                "founder": (
                    MemberProfileSerializer(founder, context={"request": request}).data
                    if founder is not None
                    else None
                ),
                "president": (
                    MemberProfileSerializer(president, context={"request": request}).data
                    if president is not None
                    else None
                ),
                "current_term": (
                    {
                        "id": current_term.id,
                        "label": current_term.label,
                        "start_year": current_term.start_year,
                        "end_year": current_term.end_year,
                    }
                    if current_term is not None
                    else None
                ),
                "stats": {
                    "connected_businesses": committee_member_count + general_member_count,
                    "committee_members": committee_member_count,
                    "general_members": general_member_count,
                    "leadership_members": members.filter(
                        category=MemberProfile.Category.LEADERSHIP
                    ).count(),
                    "executive_members": members.filter(
                        category=MemberProfile.Category.EXECUTIVE
                    ).count(),
                    "advisory_members": members.filter(
                        category=MemberProfile.Category.ADVISORY
                    ).count(),
                },
            },
            status=status.HTTP_200_OK,
        )


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


class EmergencyNoticeViewSet(PublicReadAdminWriteViewSet):
    queryset = EmergencyNotice.objects.all()
    serializer_class = EmergencyNoticeSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            return queryset
        return queryset.filter(is_active=True)

    def _sync_active_notice(self, instance):
        if instance.is_active:
            EmergencyNotice.objects.exclude(pk=instance.pk).update(is_active=False)

    def perform_create(self, serializer):
        instance = serializer.save()
        self._sync_active_notice(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._sync_active_notice(instance)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def current(self, request):
        notice = EmergencyNotice.objects.filter(is_active=True).first()
        if notice is None:
            return Response({}, status=status.HTTP_200_OK)

        serializer = self.get_serializer(notice)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def activate(self, request, pk=None):
        notice = self.get_object()
        EmergencyNotice.objects.update(is_active=False)
        notice.is_active = True
        notice.save(update_fields=["is_active", "updated_at"])
        serializer = self.get_serializer(notice)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HeroSlideViewSet(PublicReadAdminWriteViewSet):
    queryset = HeroSlide.objects.all()
    serializer_class = HeroSlideSerializer


class HomeHeroImageViewSet(PublicReadAdminWriteViewSet):
    queryset = HomeHeroImage.objects.all()
    serializer_class = HomeHeroImageSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)


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


class GeneralMemberViewSet(viewsets.ModelViewSet):
    queryset = GeneralMember.objects.all()
    serializer_class = GeneralMemberSerializer
    permission_classes = (IsAuthenticated,)


class GalleryItemViewSet(PublicReadAdminWriteViewSet):
    queryset = GalleryItem.objects.all()
    serializer_class = GalleryItemSerializer
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


class MemberSubmissionViewSet(viewsets.ModelViewSet):
    queryset = MemberSubmission.objects.select_related("published_member").all()
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
            return MemberSubmissionCreateSerializer
        return MemberSubmissionSerializer

    @staticmethod
    def _get_active_term():
        return (
            CommitteeTerm.objects.filter(is_current=True, is_active=True).first()
            or CommitteeTerm.objects.filter(is_active=True)
            .order_by("display_order", "-start_year", "id")
            .first()
        )

    @classmethod
    def _check_role_capacity(cls, role: str, ignore_member_id=None):
        cap = get_role_cap(role)
        if cap is None:
            return True, ""
        active_term = cls._get_active_term()
        if active_term is None:
            return True, ""
        normalized = role.strip()
        existing = MemberProfile.objects.filter(
            term=active_term, is_active=True, role__iexact=normalized
        )
        if ignore_member_id is not None:
            existing = existing.exclude(pk=ignore_member_id)
        if existing.count() >= int(cap["max_count"]):
            return False, role_full_message(normalized, int(cap["max_count"]))
        return True, ""

    def create(self, request, *args, **kwargs):
        settings_record = SiteSettings.objects.order_by("id").first()
        if settings_record is None or not settings_record.member_submissions_open:
            return Response(
                {"detail": "Member submissions are currently closed."},
                status=status.HTTP_403_FORBIDDEN,
            )
        proposed_role = str(request.data.get("role", "")).strip()
        ok, message = self._check_role_capacity(proposed_role)
        if not ok:
            return Response(
                {"detail": message, "role": [message]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        submission = self.get_object()

        approved_name = str(request.data.get("name", submission.name)).strip() or submission.name
        approved_role = str(request.data.get("role", submission.role)).strip() or submission.role

        ignore_id = submission.published_member_id
        ok, message = self._check_role_capacity(approved_role, ignore_member_id=ignore_id)
        if not ok:
            return Response(
                {"detail": message, "role": [message]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        approved_category = (
            str(request.data.get("category", submission.category)).strip()
            or submission.category
        )
        approved_phone = str(request.data.get("phone", submission.phone)).strip() or submission.phone
        approved_email = str(request.data.get("email", submission.email)).strip() or submission.email
        approved_note = str(request.data.get("note", submission.note)).strip()

        term_id_raw = request.data.get("term")
        try:
            term_id = int(term_id_raw) if term_id_raw not in (None, "", "null") else None
        except (TypeError, ValueError):
            term_id = None

        if term_id is None:
            current_term = self._get_active_term()
            if current_term is not None:
                term_id = current_term.id

        display_order = request.data.get("display_order", 0)
        try:
            display_order = int(display_order)
        except (TypeError, ValueError):
            display_order = 0

        if display_order <= 0:
            display_order = (
                MemberProfile.objects.filter(category=approved_category).aggregate(
                    max_order=Max("display_order")
                )["max_order"]
                or 0
            ) + 1

        if submission.published_member_id:
            published_member = submission.published_member
            published_member.name = approved_name
            published_member.role = approved_role
            published_member.category = approved_category
            published_member.phone = approved_phone
            published_member.email = approved_email
            published_member.note = approved_note
            if term_id is not None:
                published_member.term_id = term_id
            published_member.display_order = display_order
            published_member.is_active = True
            published_member.save()
        else:
            published_member = MemberProfile.objects.create(
                name=approved_name,
                role=approved_role,
                category=approved_category,
                phone=approved_phone,
                email=approved_email,
                note=approved_note,
                photo=submission.photo if submission.photo else None,
                term_id=term_id,
                display_order=display_order,
                is_active=True,
            )

        admin_notes = str(request.data.get("admin_notes", "")).strip()
        submission.name = approved_name
        submission.role = approved_role
        submission.category = approved_category
        submission.phone = approved_phone
        submission.email = approved_email
        submission.note = approved_note
        submission.review_status = MemberSubmission.ReviewStatus.APPROVED
        submission.reviewed_at = timezone.now()
        submission.published_member = published_member
        if admin_notes:
            submission.admin_notes = admin_notes
        submission.save(
            update_fields=[
                "name",
                "role",
                "category",
                "phone",
                "email",
                "note",
                "review_status",
                "reviewed_at",
                "published_member",
                "admin_notes",
                "updated_at",
            ]
        )

        serializer = self.get_serializer(submission)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        submission = self.get_object()
        if submission.published_member_id:
            return Response(
                {"detail": "Approved submissions cannot be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin_notes = str(request.data.get("admin_notes", "")).strip()
        submission.review_status = MemberSubmission.ReviewStatus.REJECTED
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
    parser_classes = (MultiPartParser, FormParser, JSONParser)

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

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def reply(self, request, pk=None):
        submission = self.get_object()
        subject = str(request.data.get("subject", "")).strip()
        body = str(request.data.get("body", "")).strip()
        recipient_email = (submission.email or "").strip()
        recipient_domain = recipient_email.rsplit("@", 1)[-1].lower() if "@" in recipient_email else ""
        attachment = request.FILES.get("attachment")

        if not recipient_email:
            return Response(
                {"detail": "This message has no sender email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not subject:
            return Response(
                {"detail": "Reply subject is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not body:
            return Response(
                {"detail": "Reply message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            recipient_domain in RESERVED_EMAIL_DOMAINS
            or recipient_domain.endswith(".example")
            or recipient_domain.endswith(".invalid")
            or recipient_domain.endswith(".localhost")
            or recipient_domain.endswith(".test")
        ):
            reply = ContactReply.objects.create(
                submission=submission,
                subject=subject,
                body=body,
                recipient_email=recipient_email,
                attachment=attachment,
                sent_by=request.user if request.user.is_authenticated else None,
                delivery_status=ContactReply.DeliveryStatus.FAILED,
                error_message="This sender email uses a reserved test domain and cannot receive mail.",
            )
            submission.is_read = True
            submission.save(update_fields=["is_read", "updated_at"])
            reply_serializer = ContactReplySerializer(reply, context={"request": request})
            return Response(
                {
                    "detail": "This sender email uses a reserved test domain and cannot receive mail.",
                    "reply": reply_serializer.data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        delivery_status = ContactReply.DeliveryStatus.SENT
        error_message = ""

        try:
            email = EmailMessage(
                subject=subject,
                body=body,
                to=[recipient_email],
            )
            if attachment:
                email.attach(attachment.name, attachment.read(), attachment.content_type)
                attachment.seek(0)
            email.send(fail_silently=False)
        except Exception as exc:
            delivery_status = ContactReply.DeliveryStatus.FAILED
            error_message = str(exc)

        reply = ContactReply.objects.create(
            submission=submission,
            subject=subject,
            body=body,
            recipient_email=recipient_email,
            attachment=attachment,
            sent_by=request.user if request.user.is_authenticated else None,
            delivery_status=delivery_status,
            error_message=error_message,
        )

        submission.is_read = True
        submission.save(update_fields=["is_read", "updated_at"])

        if delivery_status == ContactReply.DeliveryStatus.FAILED:
            reply_serializer = ContactReplySerializer(reply, context={"request": request})
            return Response(
                {
                    "detail": error_message or "Unable to send email reply.",
                    "reply": reply_serializer.data,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        reply_serializer = ContactReplySerializer(reply, context={"request": request})
        return Response(
            {
                "detail": "Reply sent successfully.",
                "reply": reply_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ContactReplyViewSet(viewsets.ModelViewSet):
    queryset = ContactReply.objects.all()
    serializer_class = ContactReplySerializer
    permission_classes = (IsAuthenticated,)
    http_method_names = ["delete", "head", "options"]


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
