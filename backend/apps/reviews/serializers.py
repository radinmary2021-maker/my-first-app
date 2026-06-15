from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    customer_display = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'rating', 'comment', 'customer_display', 'created_at']
        read_only_fields = fields

    def get_customer_display(self, obj: Review) -> str:
        """Returns abbreviated name like 'علی ر.' for privacy."""
        if obj.customer_id and obj.customer:
            name = (obj.customer.full_name or '').strip()
            if name:
                parts = name.split()
                if len(parts) >= 2:
                    return f'{parts[0]} {parts[-1][0]}.'
                return parts[0]
        return 'مشتری'


class CreateReviewSerializer(serializers.Serializer):
    rating  = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(max_length=500, allow_blank=True, default='')
