from django.contrib import admin

from .models import Branch, Business, BusinessMember


class BusinessMemberInline(admin.TabularInline):
    model      = BusinessMember
    extra      = 0
    fields     = ('user', 'role', 'is_active', 'created_at')
    readonly_fields = ('created_at',)
    raw_id_fields   = ('user',)


class BranchInline(admin.TabularInline):
    model  = Branch
    extra  = 0
    fields = ('name', 'address', 'phone', 'is_active')


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display  = ('name', 'slug', 'category', 'owner', 'is_active', 'is_deleted', 'created_at')
    list_filter   = ('category', 'is_active', 'is_deleted')
    search_fields = ('name', 'slug', 'owner__phone', 'owner__full_name')
    prepopulated_fields = {}
    readonly_fields     = ('slug', 'created_at', 'updated_at', 'deleted_at')
    raw_id_fields       = ('owner',)
    inlines = [BusinessMemberInline, BranchInline]

    def get_queryset(self, request):
        # Super admins can see deleted businesses
        return Business.all_objects.all()


@admin.register(BusinessMember)
class BusinessMemberAdmin(admin.ModelAdmin):
    list_display  = ('user', 'business', 'role', 'is_active', 'created_at')
    list_filter   = ('role', 'is_active')
    search_fields = ('user__phone', 'user__full_name', 'business__name')
    raw_id_fields = ('user', 'business')
