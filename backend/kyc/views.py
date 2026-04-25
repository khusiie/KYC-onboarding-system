from rest_framework import generics, status, permissions, views
from rest_framework.authtoken import views as auth_views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count, Avg, F, ExpressionWrapper, fields
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework.authtoken.models import Token
from .models import KYCSubmission, KYCDocument, NotificationLog
from .serializers import (
    KYCSubmissionSerializer, KYCDocumentSerializer, 
    TransitionSerializer, NotificationLogSerializer
)

class IsMerchant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'MERCHANT'

class IsReviewer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'REVIEWER'

# --- Merchant Views ---

class MerchantSubmissionView(generics.RetrieveUpdateAPIView):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [IsMerchant]

    def get_object(self):
        obj, created = KYCSubmission.objects.get_or_create(merchant=self.request.user)
        return obj

    def patch(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.status not in ['draft', 'more_info_requested']:
            return Response(
                {"error": f"Cannot edit submission in {obj.status} status."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().patch(request, *args, **kwargs)

class MerchantSubmitActionView(views.APIView):
    permission_classes = [IsMerchant]

    def post(self, request):
        submission = get_object_or_404(KYCSubmission, merchant=request.user)
        try:
            submission.transition_to('submitted', request.user)
            return Response(KYCSubmissionSerializer(submission).data)
        except DjangoValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DocumentUploadView(generics.CreateAPIView):
    serializer_class = KYCDocumentSerializer
    permission_classes = [IsMerchant]

    def perform_create(self, serializer):
        submission = get_object_or_404(KYCSubmission, merchant=self.request.user)
        if submission.status not in ['draft', 'more_info_requested']:
             raise serializers.ValidationError("Cannot upload documents in current status.")
        serializer.save(submission=submission)

# --- Reviewer Views ---

class ReviewerQueueView(generics.ListAPIView):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [IsReviewer]

    def get_queryset(self):
        return KYCSubmission.objects.filter(status='submitted').order_by('submitted_at')

class ReviewerSubmissionDetailView(generics.RetrieveAPIView):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [IsReviewer]
    queryset = KYCSubmission.objects.all()

class ReviewerActionView(views.APIView):
    permission_classes = [IsReviewer]

    def post(self, request, pk):
        submission = get_object_or_404(KYCSubmission, pk=pk)
        serializer = TransitionSerializer(data=request.data)
        
        if serializer.is_valid():
            new_status = serializer.validated_data['new_status']
            rejection_reason = serializer.validated_data.get('rejection_reason', '')
            reviewer_notes = serializer.validated_data.get('reviewer_notes', '')

            try:
                submission.rejection_reason = rejection_reason
                submission.reviewer_notes = reviewer_notes
                submission.transition_to(new_status, request.user)
                return Response(KYCSubmissionSerializer(submission).data)
            except DjangoValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReviewerMetricsView(views.APIView):
    permission_classes = [IsReviewer]

    def get(self, request):
        now = timezone.now()
        last_7_days = now - timedelta(days=7)
        
        queue_count = KYCSubmission.objects.filter(status='submitted').count()
        
        # Approval rate over last 7 days
        recent_submissions = KYCSubmission.objects.filter(updated_at__gte=last_7_days)
        total_recent = recent_submissions.exclude(status='draft').count()
        approved_recent = recent_submissions.filter(status='approved').count()
        
        approval_rate = (approved_recent / total_recent * 100) if total_recent > 0 else 0
        
        # Average time in queue (from submitted to under_review/approved/rejected)
        # For simplicity, we calculate for items that have been moved out of 'submitted' status
        reviewed_items = KYCSubmission.objects.exclude(status__in=['draft', 'submitted', 'more_info_requested']).filter(submitted_at__isnull=False)
        
        # This is a bit complex for SQLite in a single query, so we'll do it in Python for now
        total_seconds = 0
        count = reviewed_items.count()
        for item in reviewed_items:
            # We assume updated_at is when it moved out of submitted
            delta = item.updated_at - item.submitted_at
            total_seconds += delta.total_seconds()
        
        avg_hours = (total_seconds / 3600 / count) if count > 0 else 0

        return Response({
            "submissions_in_queue": queue_count,
            "average_review_time_hours": round(avg_hours, 2),
            "approval_rate_7d": round(approval_rate, 2),
        })

class CustomObtainAuthToken(auth_views.ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'role': user.role
        })
