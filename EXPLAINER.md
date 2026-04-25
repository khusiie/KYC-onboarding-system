# Playto KYC System - EXPLAINER.md

### 1. The State Machine
**Where does it live?**
The state machine logic is centralized in the `KYCSubmission` model within `backend/kyc/models.py`, specifically in the `transition_to` method.

**How do you prevent an illegal transition?**
I use a dictionary of valid transitions and check the `new_status` against the current `self.status`. If the transition isn't defined, it raises a `ValidationError`.
```python
def transition_to(self, new_status, user):
    valid_transitions = {
        'draft': ['submitted'],
        'submitted': ['under_review'],
        'under_review': ['approved', 'rejected', 'more_info_requested'],
        'more_info_requested': ['submitted'],
    }
    if new_status not in valid_transitions.get(self.status, []):
        raise ValidationError(f"Illegal state transition from {self.status} to {new_status}")
    # ... authorization checks and state updates
```

### 2. The Upload
**How are you validating file uploads?**
Validation happens in the `KYCDocumentSerializer` in `backend/kyc/serializers.py`. I check both the `size` and the `content_type` property of the uploaded file.

**What happens if someone sends a 50 MB file?**
The `validate_file` method will detect that `value.size > 5 * 1024 * 1024` and raise a `serializers.ValidationError`, returning a `400 Bad Request` to the client.
```python
def validate_file(self, value):
    if value.size > 5 * 1024 * 1024:
        raise serializers.ValidationError("File size cannot exceed 5MB.")
    if value.content_type not in ['application/pdf', 'image/jpeg', 'image/png']:
        raise serializers.ValidationError("Only PDF, JPG, and PNG files are allowed.")
    return value
```

### 3. The Queue
**The Query:**
```python
# In ReviewerQueueView (views.py)
return KYCSubmission.objects.filter(status='submitted').order_by('submitted_at')

# SLA Flag (Computed dynamically in KYCSubmissionSerializer)
def get_is_at_risk(self, obj):
    if obj.status == 'submitted' and obj.submitted_at:
        return timezone.now() - obj.submitted_at > timedelta(hours=24)
    return False
```
**Why wrote it this way?**
I used `order_by('submitted_at')` to ensure a FIFO (First-In-First-Out) queue as requested. The SLA flag is calculated dynamically in the serializer to ensure it is always accurate at the moment of request, rather than storing a static flag that could become stale.

### 4. The Auth
**How does the system stop Merchant A from seeing Merchant B's submission?**
In `MerchantSubmissionView`, I override `get_object` to fetch only the submission tied to the `request.user`.
```python
def get_object(self):
    return get_object_or_404(KYCSubmission, merchant=self.request.user)
```
Combined with the `IsMerchant` permission class, this ensures a merchant can never even query for another merchant's ID via the API.

### 5. The AI Audit
**Example of AI Bug:**
The AI initially suggested using a `ChoiceField` in the `KYCSubmission` model but forgot to handle the transition logic, allowing any status to be saved via a simple `PATCH` request.
**What I caught:** A merchant could have theoretically patched their status to `approved` if they knew the field name.
**Replacement:** I moved the status field to `read_only` in the `KYCSubmissionSerializer` and created a specific `transition_to` method in the model that requires a `user` object to verify both transition validity and authorization.
