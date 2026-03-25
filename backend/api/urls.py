from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AboutPageView,
    BusinessShowcaseItemViewSet,
    BusinessShowcaseSubmissionViewSet,
    CommitteeTermViewSet,
    ContactReplyViewSet,
    ContactSubmissionViewSet,
    CurrentUserView,
    DashboardSummaryView,
    EmergencyNoticeViewSet,
    EventViewSet,
    GeneralMemberViewSet,
    GalleryItemViewSet,
    HealthCheckView,
    HeroSlideViewSet,
    LoginView,
    MemberProfileViewSet,
    OrganizationProfileViewSet,
    ServiceItemViewSet,
    SiteSettingsView,
    token_refresh_view,
)

router = DefaultRouter()
router.register("organization-profiles", OrganizationProfileViewSet, basename="organization-profiles")
router.register("emergency-notices", EmergencyNoticeViewSet, basename="emergency-notices")
router.register("hero-slides", HeroSlideViewSet, basename="hero-slides")
router.register("services", ServiceItemViewSet, basename="services")
router.register("member-terms", CommitteeTermViewSet, basename="member-terms")
router.register("members", MemberProfileViewSet, basename="members")
router.register("general-members", GeneralMemberViewSet, basename="general-members")
router.register("gallery", GalleryItemViewSet, basename="gallery")
router.register("business-showcase", BusinessShowcaseItemViewSet, basename="business-showcase")
router.register(
    "business-showcase-submissions",
    BusinessShowcaseSubmissionViewSet,
    basename="business-showcase-submissions",
)
router.register("events", EventViewSet, basename="events")
router.register("contact-submissions", ContactSubmissionViewSet, basename="contact-submissions")
router.register("contact-replies", ContactReplyViewSet, basename="contact-replies")

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", token_refresh_view, name="auth-refresh"),
    path("auth/me/", CurrentUserView.as_view(), name="auth-me"),
    path("about-page/", AboutPageView.as_view(), name="about-page"),
    path("site-settings/", SiteSettingsView.as_view(), name="site-settings"),
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("", include(router.urls)),
]
