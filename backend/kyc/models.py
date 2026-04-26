from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('MERCHANT', 'Merchant'),
        ('REVIEWER', 'Reviewer'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MERCHANT')

    @property
    def is_merchant(self):
        return self.role == 'MERCHANT'

    @property
    def is_reviewer(self):
        return self.role == 'REVIEWER'

class KYCSubmission(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('more_info_requested', 'More Info Requested'),
    )

    merchant = models.OneToOneField(User, on_delete=models.CASCADE, related_name='kyc_submission')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Personal Details
    full_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    
    # Business Details
    business_name = models.CharField(max_length=255, blank=True)
    business_type = models.CharField(max_length=100, blank=True)
    expected_monthly_volume = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Review Details
    rejection_reason = models.TextField(blank=True, null=True)
    reviewer_notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.merchant.username} - {self.status}"

    def transition_to(self, new_status, user):
        """
        State machine logic to enforce valid transitions.
        """
        ALLOWED_TRANSITIONS = {
            'draft': ['submitted'],
            'submitted': ['under_review'],
            'under_review': ['approved', 'rejected', 'more_info_requested'],
            'more_info_requested': ['submitted'],
            'approved': [],
            'rejected': [],
        }

        # Check if transition is allowed
        if new_status != self.status and new_status not in ALLOWED_TRANSITIONS.get(self.status, []):
            raise ValidationError(f"Illegal state transition from {self.status} to {new_status}")

        # Validate authorization
        if new_status == 'submitted' and user != self.merchant:
            raise ValidationError("Only the merchant can submit their KYC.")
        
        if new_status in ['under_review', 'approved', 'rejected', 'more_info_requested'] and not user.is_reviewer:
            raise ValidationError("Only a reviewer can perform this action.")

        # Special logic for transitions
        if new_status == 'submitted':
            self.submitted_at = timezone.now()
        
        old_status = self.status
        self.status = new_status
        self.save()

        # Log notification
        NotificationLog.objects.create(
            user=self.merchant,
            event_type=f'STATUS_CHANGED_{new_status.upper()}',
            payload={
                'old_status': old_status,
                'new_status': new_status,
                'timestamp': timezone.now().isoformat(),
                'changed_by': user.username
            }
        )

class KYCDocument(models.Model):
    DOC_TYPES = (
        ('PAN', 'PAN Card'),
        ('AADHAAR', 'Aadhaar Card'),
        ('BANK_STATEMENT', 'Bank Statement'),
    )
    
    submission = models.ForeignKey(KYCSubmission, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOC_TYPES)
    file = models.FileField(upload_to='kyc_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.submission.merchant.username} - {self.document_type}"

class NotificationLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.event_type} - {self.created_at}"
