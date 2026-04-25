from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from kyc.models import KYCSubmission, KYCDocument
from django.utils import timezone
from datetime import timedelta
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial data for testing'

    def handle(self, *args, **options):
        # Clear existing data
        User.objects.exclude(is_superuser=True).delete()
        
        # Create Reviewer
        reviewer = User.objects.create_user(
            username='reviewer1',
            email='reviewer@playto.so',
            password='password123',
            role='REVIEWER'
        )
        self.stdout.write(self.style.SUCCESS('Created Reviewer: reviewer1 / password123'))

        # Merchant 1: Draft
        merchant_draft = User.objects.create_user(
            username='merchant_draft',
            email='draft@merchant.com',
            password='password123',
            role='MERCHANT'
        )
        KYCSubmission.objects.create(
            merchant=merchant_draft,
            status='draft',
            full_name='John Doe (Draft)',
            business_name='JD Freelance'
        )
        self.stdout.write(self.style.SUCCESS('Created Merchant (Draft): merchant_draft / password123'))

        # Merchant 2: Under Review
        merchant_review = User.objects.create_user(
            username='merchant_review',
            email='review@merchant.com',
            password='password123',
            role='MERCHANT'
        )
        submission = KYCSubmission.objects.create(
            merchant=merchant_review,
            status='under_review',
            full_name='Jane Smith (Review)',
            email='jane@smith.com',
            phone_number='+919876543210',
            business_name='Smith Agencies',
            business_type='Private Limited',
            expected_monthly_volume=10000.00,
            submitted_at=timezone.now() - timedelta(hours=25) # Flag as at_risk
        )
        self.stdout.write(self.style.SUCCESS('Created Merchant (Under Review - At Risk): merchant_review / password123'))

        # Merchant 3: Approved
        merchant_approved = User.objects.create_user(
            username='merchant_approved',
            email='approved@merchant.com',
            password='password123',
            role='MERCHANT'
        )
        KYCSubmission.objects.create(
            merchant=merchant_approved,
            status='approved',
            full_name='Approved Business',
            business_name='Success Corp',
            submitted_at=timezone.now() - timedelta(days=2),
            updated_at=timezone.now() - timedelta(days=1.5)
        )
        self.stdout.write(self.style.SUCCESS('Created Merchant (Approved): merchant_approved / password123'))
