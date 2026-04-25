from django.contrib import admin
from .models import User, KYCSubmission, KYCDocument, NotificationLog

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff')

@admin.register(KYCSubmission)
class KYCSubmissionAdmin(admin.ModelAdmin):
    list_display = ('merchant', 'status', 'submitted_at', 'updated_at')
    list_filter = ('status',)
    search_fields = ('merchant__username', 'full_name', 'business_name')

@admin.register(KYCDocument)
class KYCDocumentAdmin(admin.ModelAdmin):
    list_display = ('submission', 'document_type', 'uploaded_at')

@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'event_type', 'created_at')
    readonly_fields = ('user', 'event_type', 'payload', 'created_at')
