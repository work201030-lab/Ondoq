# Google Play — Data Safety draft for ONDOQ

راجع هذه الإجابات في Play Console وفق إعدادات الإنتاج الفعلية ومزودي الخدمات الذين ستفعلهم.

## Data types potentially collected
- Personal info: name, email, phone.
- Health/medical information: only information entered by the clinic as part of patient records.
- Financial/payment info: payment transaction information handled through payment provider integration.
- Location: clinic location and, when the user chooses nearby clinics, device location for discovery.
- App activity: appointments and operational activity needed to provide the service.

## Sharing
Data may be processed by infrastructure/payment/messaging/storage providers configured by the operator. The AI operations assistant uses aggregate operational metrics only in its current implementation.

## Security
- HTTPS/TLS in production.
- Password hashing.
- JWT authentication.
- Role-based access control.
- Database tenant isolation.
- Account deletion flows.

## Deletion
- In-app account deletion is available for clinic owners and patient accounts.
- External web deletion resources are provided for both clinic and patient accounts.
- Some records may be retained where legally required; disclose exact retention in the final privacy policy.

Do not submit this draft blindly; reconcile it with the exact production configuration and Google Play's current form questions.
