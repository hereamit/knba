from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import BusinessShowcaseItem, BusinessShowcaseSubmission


class BusinessShowcaseSubmissionApiTests(APITestCase):
    def setUp(self):
        self.admin_user = get_user_model().objects.create_user(
            username="admin",
            email="admin@example.com",
            password="testpass123",
        )

    def test_public_can_create_business_showcase_submission(self):
        response = self.client.post(
            reverse("business-showcase-submissions-list"),
            {
                "submitter_name": "Sita Sharma",
                "submitter_email": "sita@example.com",
                "name": "Sita Handicrafts",
                "category": "Handicraft",
                "description": "Traditional gifts and decor.",
                "phone": "+977-9812345678",
                "address": "New Road, Kathmandu",
                "website_url": "https://example.com",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        submission = BusinessShowcaseSubmission.objects.get()
        self.assertEqual(
            submission.review_status,
            BusinessShowcaseSubmission.ReviewStatus.PENDING,
        )
        self.assertEqual(submission.badge, "Business Showcase")

    def test_admin_can_approve_submission_and_publish_listing(self):
        submission = BusinessShowcaseSubmission.objects.create(
            submitter_name="Ram Shrestha",
            submitter_email="ram@example.com",
            name="Ram Electronics",
            category="Electronics",
            description="Consumer electronics and repair support.",
            phone="+977-9800000000",
            address="Khichapokhari, Kathmandu",
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            reverse("business-showcase-submissions-approve", args=[submission.id]),
            {"admin_notes": "Verified and ready to publish."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        submission.refresh_from_db()
        self.assertEqual(
            submission.review_status,
            BusinessShowcaseSubmission.ReviewStatus.APPROVED,
        )
        self.assertIsNotNone(submission.published_item)
        self.assertEqual(submission.admin_notes, "Verified and ready to publish.")

        published_item = BusinessShowcaseItem.objects.get(pk=submission.published_item_id)
        self.assertEqual(published_item.name, "Ram Electronics")
        self.assertTrue(published_item.is_active)
