from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from kyc.models import KYCSubmission

User = get_user_model()

class KYCStateMachineTest(TestCase):
    def setUp(self):
        self.merchant = User.objects.create_user(
            username='merchant', password='password', role='MERCHANT'
        )
        self.reviewer = User.objects.create_user(
            username='reviewer', password='password', role='REVIEWER'
        )
        self.submission = KYCSubmission.objects.create(merchant=self.merchant)

    def test_illegal_transition_approved_to_draft(self):
        """Test that a submission cannot move from approved back to draft."""
        # 1. Setup an approved state
        self.submission.status = 'approved'
        self.submission.save()

        # 2. Try to transition to draft
        with self.assertRaises(ValidationError) as cm:
            self.submission.transition_to('draft', self.reviewer)
        
        self.assertEqual(
            str(cm.exception.detail[0] if hasattr(cm.exception, 'detail') else cm.exception), 
            "['Illegal state transition from approved to draft']"
        )

    def test_merchant_cannot_approve(self):
        """Test that a merchant cannot approve their own submission."""
        self.submission.status = 'under_review'
        self.submission.save()

        with self.assertRaises(ValidationError):
            self.submission.transition_to('approved', self.merchant)

    def test_valid_transition_draft_to_submitted(self):
        """Test a valid transition."""
        self.submission.transition_to('submitted', self.merchant)
        self.assertEqual(self.submission.status, 'submitted')
        self.assertIsNotNone(self.submission.submitted_at)
