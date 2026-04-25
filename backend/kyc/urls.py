from django.urls import path
from . import views
from rest_framework.authtoken import views as auth_views

urlpatterns = [
    # Auth
    path('auth/token/', views.CustomObtainAuthToken.as_view(), name='api_token'),
    
    # Merchant
    path('kyc/me/', views.MerchantSubmissionView.as_view(), name='merchant_kyc'),
    path('kyc/me/submit/', views.MerchantSubmitActionView.as_view(), name='merchant_submit'),
    path('kyc/documents/', views.DocumentUploadView.as_view(), name='document_upload'),
    
    # Reviewer
    path('reviewer/queue/', views.ReviewerQueueView.as_view(), name='reviewer_queue'),
    path('reviewer/submission/<int:pk>/', views.ReviewerSubmissionDetailView.as_view(), name='reviewer_detail'),
    path('reviewer/submission/<int:pk>/action/', views.ReviewerActionView.as_view(), name='reviewer_action'),
    path('reviewer/metrics/', views.ReviewerMetricsView.as_view(), name='reviewer_metrics'),
]
