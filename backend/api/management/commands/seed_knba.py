import os
from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from api.models import (
    BusinessShowcaseItem,
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

        OrganizationProfile.objects.get_or_create(
            short_name="KNBA",
            defaults={
                "organization_name": "Khichapokhari Newroad Business Association",
                "office_address": "Khichapokhari, New Road, Kathmandu",
                "phone_number": "+977-1-5350000",
                "email": "secretariat@knba.org.np",
                "map_embed_url": "https://www.google.com/maps?q=Khichapokhari%20New%20Road%20Kathmandu&output=embed",
                "is_active": True,
            },
        )

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

        current_term, _ = CommitteeTerm.objects.update_or_create(
            start_year=2025,
            end_year=2027,
            defaults={
                "label": "2025-2027 Working Committee",
                "display_order": 1,
                "is_current": True,
                "is_active": True,
            },
        )
        CommitteeTerm.objects.update_or_create(
            start_year=2023,
            end_year=2025,
            defaults={
                "label": "2023-2025 Working Committee",
                "display_order": 2,
                "is_current": False,
                "is_active": True,
            },
        )

        MemberProfile.objects.all().delete()

        members = [
            ("Sagar Shakya", "leadership", "President", "+977-9801000001", "sagar.shakya@knba.org.np", "", "/people/president.jpg", 1),
            ("Rajendra Baran", "leadership", "Founding President", "+977-9801000002", "rajendra.baran@knba.org.np", "", "/people/vice-president.jpg", 2),
            ("Gautam Kumar Shakya", "leadership", "Immediate Past President", "+977-9801000003", "gautam.kumar.shakya@knba.org.np", "", "/people/secretariat.jpg", 3),
            ("Manoj Babu Shrestha", "leadership", "Past President", "+977-9801000004", "manoj.babu.shrestha@knba.org.np", "", "/people/advisory-1.jpg", 4),
            ("Gaur Gupta Khadgi", "leadership", "Senior Vice President", "+977-9801000005", "gaur.gupta.khadgi@knba.org.np", "", "/people/advisory-2.jpg", 5),
            ("Tej Prasad Jawali", "leadership", "First Vice President", "+977-9801000006", "tej.prasad.jawali@knba.org.np", "", "/people/advisory-3.jpg", 6),
            ("Dipak Kumar Shrestha", "leadership", "Second Vice President", "+977-9801000007", "dipak.kumar.shrestha@knba.org.np", "", "/people/member-1.jpg", 7),
            ("Ravi Ladhuru Shyam Chhetri", "leadership", "General Secretary", "+977-9801000008", "ravi.ladhuru.shyam.chhetri@knba.org.np", "", "/people/member-2.jpg", 8),
            ("Dil Bahadur Rokka", "leadership", "Secretary", "+977-9801000009", "dil.bahadur.rokka@knba.org.np", "", "/people/member-3.jpg", 9),
            ("Pramod Mandali", "leadership", "Treasurer", "+977-9801000010", "pramod.mandali@knba.org.np", "", "/people/member-4.jpg", 10),
            ("Budh Bahadur Thapa Magar", "leadership", "Joint Treasurer", "+977-9801000011", "budh.bahadur.thapa.magar@knba.org.np", "", "/people/member-5.jpg", 11),
            ("Suresh Ratna Shakya", "executive", "Executive Committee Member", "+977-9801000012", "suresh.ratna.shakya@knba.org.np", "", "/people/member-6.jpg", 12),
            ("Sudhamani Mandali", "executive", "Executive Committee Member", "+977-9801000013", "sudhamani.mandali@knba.org.np", "", "/people/president.jpg", 13),
            ("Sanjay Raj Subedi", "executive", "Executive Committee Member", "+977-9801000014", "sanjay.raj.subedi@knba.org.np", "", "/people/vice-president.jpg", 14),
            ("Ranjit Maharti", "executive", "Executive Committee Member", "+977-9801000015", "ranjit.maharti@knba.org.np", "", "/people/secretariat.jpg", 15),
            ("Tilak Prasad Ojha", "executive", "Executive Committee Member", "+977-9801000016", "tilak.prasad.ojha@knba.org.np", "", "/people/advisory-1.jpg", 16),
            ("Krishna Thigre", "executive", "Executive Committee Member", "+977-9801000017", "krishna.thigre@knba.org.np", "", "/people/advisory-2.jpg", 17),
            ("Shailendra Shah", "executive", "Executive Committee Member", "+977-9801000018", "shailendra.shah@knba.org.np", "", "/people/advisory-3.jpg", 18),
            ("Ghan Prasad Poudel", "executive", "Executive Committee Member", "+977-9801000019", "ghan.prasad.poudel@knba.org.np", "", "/people/member-1.jpg", 19),
            ("Arjun Shah", "executive", "Executive Committee Member", "+977-9801000020", "arjun.shah@knba.org.np", "", "/people/member-2.jpg", 20),
            ("Gangu Shrestha", "executive", "Executive Committee Member", "+977-9801000021", "gangu.shrestha@knba.org.np", "", "/people/member-3.jpg", 21),
            ("Prakash Dhakal", "executive", "Executive Committee Member", "+977-9801000022", "prakash.dhakal@knba.org.np", "", "/people/member-4.jpg", 22),
            ("Shobha Sthapit", "executive", "Executive Committee Member", "+977-9801000023", "shobha.sthapit@knba.org.np", "", "/people/member-5.jpg", 23),
            ("Bishnu Maya Khadgi", "executive", "Executive Committee Member", "+977-9801000024", "bishnu.maya.khadgi@knba.org.np", "", "/people/member-6.jpg", 24),
            ("Manoj Mandali", "executive", "Executive Committee Member", "+977-9801000025", "manoj.mandali@knba.org.np", "", "/people/president.jpg", 25),
            ("Rajen Dangol", "advisory", "Advisor", "+977-9801000026", "rajen.dangol@knba.org.np", "Chairperson, Khichapokhari Foot Sale", "/people/advisory-1.jpg", 26),
            ("Janga Bahadur Shrestha", "advisory", "Advisor", "+977-9801000027", "janga.bahadur.shrestha@knba.org.np", "", "/people/advisory-2.jpg", 27),
            ("Krishna Prasad", "advisory", "Advisor", "+977-9801000028", "krishna.prasad@knba.org.np", "", "/people/advisory-3.jpg", 28),
            ("Charan Prakash Pradhan", "advisory", "Advisor", "+977-9801000029", "charan.prakash.pradhan@knba.org.np", "", "/people/member-1.jpg", 29),
            ("Arjun Jawali", "advisory", "Advisor", "+977-9801000030", "arjun.jawali@knba.org.np", "", "/people/member-2.jpg", 30),
            ("Ram Kumar Pandit", "advisory", "Advisor", "+977-9801000031", "ram.kumar.pandit@knba.org.np", "", "/people/member-3.jpg", 31),
            ("Krishna Prasad Khanal", "advisory", "Advisor", "+977-9801000032", "krishna.prasad.khanal@knba.org.np", "", "/people/member-4.jpg", 32),
            ("Gopal Prasad Shrestha", "advisory", "Advisor", "+977-9801000033", "gopal.prasad.shrestha@knba.org.np", "", "/people/member-5.jpg", 33),
            ("Jit Narayan Dangol", "advisory", "Advisor", "+977-9801000034", "jit.narayan.dangol@knba.org.np", "", "/people/member-6.jpg", 34),
            ("Mitra Poudel", "advisory", "Advisor", "+977-9801000035", "mitra.poudel@knba.org.np", "", "/people/president.jpg", 35),
            ("Balaram Acharya", "advisory", "Advisor", "+977-9801000036", "balaram.acharya@knba.org.np", "", "/people/vice-president.jpg", 36),
            ("Ram Prasad Barnaliya", "advisory", "Advisor", "+977-9801000037", "ram.prasad.barnaliya@knba.org.np", "", "/people/secretariat.jpg", 37),
            ("Ram Bahadur Sundel", "advisory", "Legal Advisor", "+977-9801000038", "ram.bahadur.sundel@knba.org.np", "", "/people/advisory-1.jpg", 38),
        ]
        for name, category, role, phone, email, note, photo_url, display_order in members:
            MemberProfile.objects.create(
                term=current_term,
                name=name,
                category=category,
                role=role,
                phone=phone,
                email=email,
                note=note,
                photo_url=photo_url,
                display_order=display_order,
                is_active=True,
            )

        gallery_items = [
            (
                "Market Coordination Meeting",
                "Meetings",
                "Association leaders and member businesses reviewing market operations.",
                "/hero/new-road-1.jpg",
                1,
                True,
            ),
            (
                "Community Outreach Program",
                "Community",
                "A collaborative outreach initiative focused on cleanliness and neighborhood engagement.",
                "/hero/asan-market.jpg",
                2,
                True,
            ),
            (
                "Business Capacity Workshop",
                "Training",
                "Training session for members on practical business topics and digital adaptation.",
                "/photos/kathmandu-market.jpg",
                3,
                True,
            ),
            (
                "Festival Street Illumination",
                "Events",
                "Seasonal decorations and collective preparations in New Road.",
                "/hero/new-road-gate.jpg",
                4,
                True,
            ),
            (
                "Stakeholder Partnership Session",
                "Meetings",
                "Discussion with external stakeholders and local authorities.",
                "/photos/asan-tole.jpg",
                5,
                True,
            ),
            (
                "New Road Heritage Walk",
                "Community",
                "An activity connecting commerce, local culture, and neighborhood identity.",
                "/photos/new-road-2.jpg",
                6,
                False,
            ),
        ]
        for (
            title,
            category,
            description,
            image_url,
            display_order,
            is_featured,
        ) in gallery_items:
            GalleryItem.objects.update_or_create(
                title=title,
                defaults={
                    "category": category,
                    "description": description,
                    "image_url": image_url,
                    "is_featured": is_featured,
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

        business_showcase_items = [
            {
                "name": "New Road Fashion House",
                "category": "Retail Apparel",
                "description": "A busy New Road clothing store offering seasonal collections, wholesale support, and festival promotions for local shoppers.",
                "phone": "+977-9801200101",
                "address": "Khichapokhari, New Road, Kathmandu",
                "image_url": "/business/fashion-house.jpg",
                "badge": "Featured Sponsor",
                "website_url": "https://newroadfashion.example.com",
                "facebook_url": "https://facebook.com/newroadfashionhouse",
                "instagram_url": "https://instagram.com/newroadfashionhouse",
                "ecommerce_url": "",
                "is_featured": True,
                "display_order": 1,
            },
            {
                "name": "Kathmandu Digital Traders",
                "category": "Electronics",
                "description": "A member business focused on mobile accessories, gadgets, and after-sales support with competitive city-center pricing.",
                "phone": "+977-9801200102",
                "address": "Bishal Bazaar Side, New Road, Kathmandu",
                "image_url": "/business/digital-traders.jpg",
                "badge": "Business Showcase",
                "website_url": "https://kathmandudigital.example.com",
                "facebook_url": "https://facebook.com/kathmandudigitaltraders",
                "instagram_url": "",
                "ecommerce_url": "",
                "is_featured": False,
                "display_order": 2,
            },
            {
                "name": "Milan Jewellery Center",
                "category": "Jewellery & Accessories",
                "description": "Trusted local jewellery and gift retailer serving walk-in customers and repeat family shoppers from across Kathmandu.",
                "phone": "+977-9801200103",
                "address": "Khichapokhari Chowk, Kathmandu",
                "image_url": "/business/jewellery-center.jpg",
                "badge": "Member Business",
                "website_url": "",
                "facebook_url": "https://facebook.com/milanjewellerycenter",
                "instagram_url": "https://instagram.com/milanjewellerycenter",
                "ecommerce_url": "",
                "is_featured": False,
                "display_order": 3,
            },
            {
                "name": "Himal Trade Suppliers",
                "category": "Wholesale Supply",
                "description": "A wholesale trading business connecting merchants with packaging materials, shop supplies, and fast restocking support.",
                "phone": "+977-9801200104",
                "address": "New Road Core Market, Kathmandu",
                "image_url": "/business/trade-suppliers.jpg",
                "badge": "Featured Sponsor",
                "website_url": "https://himaltrade.example.com",
                "facebook_url": "https://facebook.com/himaltradesuppliers",
                "instagram_url": "",
                "ecommerce_url": "https://shop.himaltrade.example.com",
                "is_featured": True,
                "display_order": 4,
            },
            {
                "name": "Bagmati Footwear Point",
                "category": "Footwear",
                "description": "A showroom-style footwear outlet with casual, formal, and seasonal inventory for daily retail and festive demand.",
                "phone": "+977-9801200105",
                "address": "Near Juddha Salik, New Road, Kathmandu",
                "image_url": "/business/footwear-point.jpg",
                "badge": "Business Showcase",
                "website_url": "https://bagmatifootwear.example.com",
                "facebook_url": "https://facebook.com/bagmatifootwearpoint",
                "instagram_url": "",
                "ecommerce_url": "https://shop.bagmatifootwear.example.com",
                "is_featured": False,
                "display_order": 5,
            },
            {
                "name": "Heritage Gift & Stationery",
                "category": "Gift & Stationery",
                "description": "A small but visible market business offering school, office, and gift products with dependable local customer service.",
                "phone": "+977-9801200106",
                "address": "Khichapokhari Lane, Kathmandu",
                "image_url": "/business/gift-stationery.jpg",
                "badge": "Member Business",
                "website_url": "",
                "facebook_url": "https://facebook.com/heritagegiftstationery",
                "instagram_url": "",
                "ecommerce_url": "",
                "is_featured": False,
                "display_order": 6,
            },
        ]
        for business_item in business_showcase_items:
            BusinessShowcaseItem.objects.update_or_create(
                name=business_item["name"],
                defaults={**business_item, "is_active": True},
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
