import os
from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from api.models import ContactSubmission, Event, GalleryItem, HeroSlide, MemberProfile, ServiceItem, SiteSettings

User = get_user_model()


class Command(BaseCommand):
    help = "Seed the KNBA backend with starter content and an admin user."

    def handle(self, *args, **options):
        settings, _ = SiteSettings.objects.get_or_create(
            short_name="KNBA",
            defaults={
                "organization_name": "Khichapokhari Newroad Business Association",
                "office_address": "Khichapokhari, New Road, Kathmandu",
                "office_phone": "+977-1-5350000",
                "office_email": "secretariat@knba.org.np",
                "emergency_label": "Emergency Notice",
                "emergency_message": (
                    "For urgent market coordination, safety concerns, or service disruption "
                    "updates, contact the KNBA secretariat immediately."
                ),
                "emergency_contact": "+977-1-5350000",
                "history_text": (
                    "Khichapokhari Newroad Business Association was established by business "
                    "leaders and market stakeholders who recognized the need for an organized "
                    "voice in one of Kathmandu's busiest commercial zones."
                ),
                "founder_name": "Hari Krishna Tuladhar",
                "founder_title": "Founder Chair",
                "founder_message": (
                    "Our goal was to unite the market under one practical platform so that "
                    "business owners could address shared operational issues together."
                ),
                "founder_image_url": "/people/president.jpg",
                "president_name": "Ramesh Shrestha",
                "president_title": "Current President",
                "president_message": (
                    "The current leadership is focused on modernizing association services, "
                    "improving communication with members, and building stronger coordination "
                    "with local authorities."
                ),
                "president_image_url": "/people/president.jpg",
                "mission_text": (
                    "Support every member business with practical coordination, representation, "
                    "and easier access to information."
                ),
                "vision_text": (
                    "Create a well-managed, trusted, and future-ready business district in "
                    "Khichapokhari and New Road."
                ),
                "map_embed_url": "https://www.google.com/maps?q=Khichapokhari%20New%20Road%20Kathmandu&output=embed",
                "social_links": [
                    {"label": "Facebook", "href": "https://facebook.com"},
                    {"label": "LinkedIn", "href": "https://linkedin.com"},
                    {"label": "YouTube", "href": "https://youtube.com"},
                ],
            },
        )
        settings.organization_name = "Khichapokhari Newroad Business Association"
        settings.save()

        slides = [
            {
                "title": "A stronger New Road business community starts with coordinated action.",
                "short_title": "Market Advocacy",
                "image_url": "/hero/new-road-1.jpg",
                "credit": "Photo: S Pakhrin / Wikimedia Commons",
                "display_order": 1,
            },
            {
                "title": "From orientation sessions to festivals, the association keeps members connected.",
                "short_title": "Events & Programs",
                "image_url": "/hero/new-road-gate.jpg",
                "credit": "Photo: Vyacheslav Argenberg / Wikimedia Commons",
                "display_order": 2,
            },
            {
                "title": "A digital presence that reflects the energy and credibility of the organization.",
                "short_title": "Digital Presence",
                "image_url": "/hero/asan-market.jpg",
                "credit": "Photo: McKay Savage / Wikimedia Commons",
                "display_order": 3,
            },
        ]
        for slide in slides:
            HeroSlide.objects.update_or_create(
                short_title=slide["short_title"],
                defaults={
                    "title": slide["title"],
                    "image_url": slide["image_url"],
                    "credit": slide["credit"],
                    "display_order": slide["display_order"],
                    "is_active": True,
                },
            )

        services = [
            {
                "tag": "Representation",
                "title": "Business Advocacy & Liaison",
                "description": "Represent member concerns with local government, ward offices, utilities, and market stakeholders.",
                "points": [
                    "Coordinate collective issues related to trade operations and public services",
                    "Support dialogue with authorities on market safety, traffic, or access concerns",
                    "Provide a formal channel for association notices and position statements",
                ],
                "display_order": 1,
            },
            {
                "tag": "Operations",
                "title": "Member Coordination & Support Desk",
                "description": "Operate as a support desk for documentation guidance, issue routing, and member communication.",
                "points": [
                    "Maintain member records and renewal reminders",
                    "Route inquiries and complaints to the right authority or internal committee",
                    "Share circulars, notices, and urgent updates with businesses efficiently",
                ],
                "display_order": 2,
            },
            {
                "tag": "Capacity Building",
                "title": "Training, Awareness & Networking",
                "description": "Help local businesses adapt through workshops, awareness campaigns, and community-led knowledge sharing.",
                "points": [
                    "Organize training on business compliance, digital payments, and customer service",
                    "Run networking sessions and peer learning for merchants",
                    "Promote seasonal campaigns, festivals, and market activation events",
                ],
                "display_order": 3,
            },
        ]
        for service in services:
            ServiceItem.objects.update_or_create(
                title=service["title"],
                defaults=service,
            )

        members = [
            ("Ramesh Shrestha", "president", "President", "+977-9801000101", "president@knba.org.np", "/people/president.jpg", 1),
            ("Sushil Tuladhar", "vice_president", "Vice-President", "+977-9801000102", "vicepresident@knba.org.np", "/people/vice-president.jpg", 2),
            ("Anita Maharjan", "secretariat", "Secretariat", "+977-9801000103", "secretariat@knba.org.np", "/people/secretariat.jpg", 3),
            ("Prakash Manandhar", "advisory", "Advisory Board", "+977-9801000201", "prakash@knba.org.np", "/people/advisory-1.jpg", 4),
            ("Bina Kansakar", "advisory", "Advisory Board", "+977-9801000202", "bina@knba.org.np", "/people/advisory-2.jpg", 5),
            ("Sanjeev Rajbhandari", "advisory", "Advisory Board", "+977-9801000203", "sanjeev@knba.org.np", "/people/advisory-3.jpg", 6),
            ("Nabin Shakya", "member", "Executive Member", "+977-9801000301", "nabin@knba.org.np", "/people/member-1.jpg", 7),
            ("Pramila Joshi", "member", "Executive Member", "+977-9801000302", "pramila@knba.org.np", "/people/member-2.jpg", 8),
            ("Deepak Shrestha", "member", "Executive Member", "+977-9801000303", "deepak@knba.org.np", "/people/member-3.jpg", 9),
            ("Sarita Bajracharya", "member", "Executive Member", "+977-9801000304", "sarita@knba.org.np", "/people/member-4.jpg", 10),
            ("Milan Tuladhar", "member", "Executive Member", "+977-9801000305", "milan@knba.org.np", "/people/member-5.jpg", 11),
            ("Rita Maharjan", "member", "Executive Member", "+977-9801000306", "rita@knba.org.np", "/people/member-6.jpg", 12),
        ]
        for name, category, role, phone, email, photo_url, display_order in members:
            MemberProfile.objects.update_or_create(
                email=email,
                defaults={
                    "name": name,
                    "category": category,
                    "role": role,
                    "phone": phone,
                    "photo_url": photo_url,
                    "display_order": display_order,
                    "is_active": True,
                },
            )

        gallery_items = [
            ("Market Coordination Meeting", "Meetings", "Association leaders and member businesses reviewing market operations.", "/hero/new-road-1.jpg", 1),
            ("Community Outreach Program", "Community", "A collaborative outreach initiative focused on cleanliness and neighborhood engagement.", "/hero/asan-market.jpg", 2),
            ("Business Capacity Workshop", "Training", "Training session for members on practical business topics and digital adaptation.", "/photos/kathmandu-market.jpg", 3),
            ("Festival Street Illumination", "Events", "Seasonal decorations and collective preparations in New Road.", "/hero/new-road-gate.jpg", 4),
            ("Stakeholder Partnership Session", "Meetings", "Discussion with external stakeholders and local authorities.", "/photos/asan-tole.jpg", 5),
            ("New Road Heritage Walk", "Community", "An activity connecting commerce, local culture, and neighborhood identity.", "/photos/new-road-2.jpg", 6),
        ]
        for title, category, description, image_url, display_order in gallery_items:
            GalleryItem.objects.update_or_create(
                title=title,
                defaults={
                    "category": category,
                    "description": description,
                    "image_url": image_url,
                    "display_order": display_order,
                    "is_active": True,
                },
            )

        events = [
            ("Retail Digitization Orientation", date(2026, 3, 18), "KNBA Hall", "open", "Orientation for member businesses on digital billing and payment tools.", 1),
            ("Festival Coordination Meeting", date(2026, 3, 25), "New Road Market Corridor", "planning", "Joint planning with local stakeholders around festive operations.", 2),
            ("Member Networking Evening", date(2026, 4, 3), "Community Venue", "confirmed", "An association-led evening focused on partnerships and member introductions.", 3),
        ]
        for title, event_date, venue, status_value, description, display_order in events:
            Event.objects.update_or_create(
                title=title,
                defaults={
                    "event_date": event_date,
                    "venue": venue,
                    "status": status_value,
                    "description": description,
                    "display_order": display_order,
                    "is_active": True,
                },
            )

        ContactSubmission.objects.get_or_create(
            email="sanjay@example.com",
            subject="Membership Support",
            defaults={
                "full_name": "Sanjay Shrestha",
                "message": "I would like to renew our business membership and confirm the required documentation for this year.",
                "is_read": False,
            },
        )
        ContactSubmission.objects.get_or_create(
            email="pratima@example.com",
            subject="Partnership",
            defaults={
                "full_name": "Pratima Maharjan",
                "message": "Our organization is interested in collaborating with KNBA on a small business awareness program in New Road.",
                "is_read": False,
            },
        )
        ContactSubmission.objects.get_or_create(
            email="rajan@example.com",
            subject="Event Inquiry",
            defaults={
                "full_name": "Rajan Tuladhar",
                "message": "Please share upcoming training and networking event details for merchants in the Khichapokhari area.",
                "is_read": True,
            },
        )

        admin_email = os.getenv("KNBA_ADMIN_EMAIL", "admin@knba.org.np")
        admin_password = os.getenv("KNBA_ADMIN_PASSWORD", "knba-admin")
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": admin_email,
                "first_name": "KNBA",
                "last_name": "Admin",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin_user.email = admin_email
        admin_user.first_name = "KNBA"
        admin_user.last_name = "Admin"
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.set_password(admin_password)
        admin_user.save()

        action = "created" if created else "updated"
        self.stdout.write(self.style.SUCCESS(f"Seed complete. Admin user {action}: {admin_email}"))
