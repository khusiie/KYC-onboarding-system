from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import KYCSubmission, KYCDocument, NotificationLog
from django.core.exceptions import ValidationError as DjangoValidationError

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role')

class KYCDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCDocument
        fields = ('id', 'document_type', 'file', 'uploaded_at')

    def validate_file(self, value):
        # 1. Size Validation (5MB)
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 5MB.")

        # 2. Type Validation
        allowed_types = ['application/pdf', 'image/jpeg', 'image/png']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("Only PDF, JPG, and PNG files are allowed.")
        
        return value

class KYCSubmissionSerializer(serializers.ModelSerializer):
    documents = KYCDocumentSerializer(many=True, read_only=True)
    merchant_name = serializers.ReadOnlyField(source='merchant.username')
    is_at_risk = serializers.SerializerMethodField()

    class Meta:
        model = KYCSubmission
        fields = (
            'id', 'merchant_name', 'status', 'full_name', 'email', 
            'phone_number', 'business_name', 'business_type', 
            'expected_monthly_volume', 'rejection_reason', 
            'documents', 'submitted_at', 'updated_at', 'is_at_risk'
        )
        read_only_fields = ('status', 'submitted_at', 'updated_at', 'rejection_reason')

    def validate_full_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Full name must be at least 3 characters long.")
        return value

    def validate_phone_number(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")
        if not (10 <= len(value) <= 15):
            raise serializers.ValidationError("Phone number must be between 10 and 15 digits.")
        return value

    def validate_expected_monthly_volume(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Monthly volume must be a positive number.")
        return value

    def get_is_at_risk(self, obj):
        if obj.status == 'submitted' and obj.submitted_at:
            from django.utils import timezone
            from datetime import timedelta
            return timezone.now() - obj.submitted_at > timedelta(hours=24)
        return False

class TransitionSerializer(serializers.Serializer):
    new_status = serializers.ChoiceField(choices=[
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('more_info_requested', 'More Info Requested'),
    ])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    reviewer_notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['new_status'] == 'rejected' and not data.get('rejection_reason'):
            raise serializers.ValidationError({"rejection_reason": "This field is required when rejecting."})
        return data

class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = '__all__'
