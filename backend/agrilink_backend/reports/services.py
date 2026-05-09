# reports/services.py
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from batches.models import Batch
from orders.models import Order
from users.models import User
from tracking.models import DeliveryTracking


class ReportGenerator:
    """Service class for generating different types of reports"""
    
    def __init__(self, start_date, end_date):
        """Initialize with date range, handling both string and date objects"""
        from datetime import datetime, date
        
        # Convert strings to date objects if needed
        if isinstance(start_date, str):
            self.start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        elif isinstance(start_date, date):
            self.start_date = start_date
        else:
            raise ValueError(f"Invalid start_date type: {type(start_date)}")
        
        if isinstance(end_date, str):
            self.end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        elif isinstance(end_date, date):
            self.end_date = end_date
        else:
            raise ValueError(f"Invalid end_date type: {type(end_date)}")
    
    def generate_sales_report(self):
        """Generate sales report for the date range"""
        orders = Order.objects.filter(
            created_at__date__gte=self.start_date,
            created_at__date__lte=self.end_date
        )
        
        total_orders = orders.count()
        delivered_orders = orders.filter(status='DELIVERED').count()
        cancelled_orders = orders.filter(status='CANCELLED').count()
        
        # Total quantity sold
        total_kg_sold = orders.filter(status='DELIVERED').aggregate(
            total=Sum('quantity_kg')
        )['total'] or 0
        
        # Orders by status
        orders_by_status = orders.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Top customers
        top_customers = orders.values(
            'customer__username',
            'customer__id'
        ).annotate(
            order_count=Count('id'),
            total_kg=Sum('quantity_kg')
        ).order_by('-order_count')[:10]
        
        # Daily breakdown
        from django.db.models.functions import TruncDate
        daily_orders = orders.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            count=Count('id'),
            total_kg=Sum('quantity_kg')
        ).order_by('date')
        
        return {
            'summary': {
                'total_orders': total_orders,
                'delivered_orders': delivered_orders,
                'cancelled_orders': cancelled_orders,
                'total_kg_sold': float(total_kg_sold),
                'delivery_rate': round((delivered_orders / total_orders * 100) if total_orders > 0 else 0, 2),
            },
            'orders_by_status': list(orders_by_status),
            'top_customers': list(top_customers),
            'daily_breakdown': list(daily_orders),
        }
    
    def generate_inventory_report(self):
        """Generate inventory report"""
        batches = Batch.objects.filter(
            created_at__date__gte=self.start_date,
            created_at__date__lte=self.end_date
        )
        
        # Total inventory
        total_batches = batches.count()
        approved_batches = batches.filter(status='APPROVED').count()
        pending_batches = batches.filter(status='PENDING').count()
        rejected_batches = batches.filter(status='REJECTED').count()
        
        # Total coffee by type
        coffee_by_type = batches.filter(status='APPROVED').values(
            'coffee_type'
        ).annotate(
            count=Count('id'),
            total_kg=Sum('quantity_kg')
        ).order_by('-total_kg')
        
        # Total available coffee
        total_available_kg = batches.filter(status='APPROVED').aggregate(
            total=Sum('quantity_kg')
        )['total'] or 0
        
        # Batches by origin
        batches_by_origin = batches.filter(status='APPROVED').values(
            'origin'
        ).annotate(
            count=Count('id'),
            total_kg=Sum('quantity_kg')
        ).order_by('-total_kg')[:10]
        
        return {
            'summary': {
                'total_batches': total_batches,
                'approved_batches': approved_batches,
                'pending_batches': pending_batches,
                'rejected_batches': rejected_batches,
                'total_available_kg': float(total_available_kg),
            },
            'coffee_by_type': list(coffee_by_type),
            'batches_by_origin': list(batches_by_origin),
        }
    
    def generate_dealer_performance_report(self):
        """Generate dealer performance report"""
        batches = Batch.objects.filter(
            created_at__date__gte=self.start_date,
            created_at__date__lte=self.end_date
        )
        
        # Dealer statistics
        dealer_stats = batches.values(
            'dealer__username',
            'dealer__id'
        ).annotate(
            total_batches=Count('id'),
            approved_batches=Count('id', filter=Q(status='APPROVED')),
            rejected_batches=Count('id', filter=Q(status='REJECTED')),
            pending_batches=Count('id', filter=Q(status='PENDING')),
            total_kg=Sum('quantity_kg'),
            approval_rate=Count('id', filter=Q(status='APPROVED')) * 100.0 / Count('id')
        ).order_by('-total_batches')
        
        # Top performers
        top_dealers = list(dealer_stats[:10])
        
        # Dealers needing attention (high rejection rate)
        dealers_needing_attention = batches.values(
            'dealer__username',
            'dealer__id'
        ).annotate(
            total_batches=Count('id'),
            rejected_batches=Count('id', filter=Q(status='REJECTED')),
            rejection_rate=Count('id', filter=Q(status='REJECTED')) * 100.0 / Count('id')
        ).filter(rejection_rate__gt=30).order_by('-rejection_rate')
        
        return {
            'top_dealers': top_dealers,
            'dealers_needing_attention': list(dealers_needing_attention),
            'total_dealers': dealer_stats.count(),
        }
    
    def generate_customer_activity_report(self):
        """Generate customer activity report"""
        orders = Order.objects.filter(
            created_at__date__gte=self.start_date,
            created_at__date__lte=self.end_date
        )
        
        # Customer statistics
        customer_stats = orders.values(
            'customer__username',
            'customer__id'
        ).annotate(
            total_orders=Count('id'),
            delivered_orders=Count('id', filter=Q(status='DELIVERED')),
            cancelled_orders=Count('id', filter=Q(status='CANCELLED')),
            total_kg=Sum('quantity_kg')
        ).order_by('-total_orders')
        
        # Active customers
        active_customers = customer_stats.count()
        
        # New customers in period
        new_customers = User.objects.filter(
            role='CUSTOMER',
            date_joined__date__gte=self.start_date,
            date_joined__date__lte=self.end_date
        ).count()
        
        # Top customers
        top_customers = list(customer_stats[:10])
        
        return {
            'summary': {
                'active_customers': active_customers,
                'new_customers': new_customers,
            },
            'top_customers': top_customers,
        }
    
    def generate_order_summary_report(self):
        """Generate order summary report"""
        orders = Order.objects.filter(
            created_at__date__gte=self.start_date,
            created_at__date__lte=self.end_date
        )
        
        # Status breakdown
        status_breakdown = orders.values('status').annotate(
            count=Count('id'),
            total_kg=Sum('quantity_kg')
        ).order_by('-count')
        
        # Average order size
        avg_order_size = orders.aggregate(
            avg=Avg('quantity_kg')
        )['avg'] or 0
        
        # Total orders and quantity
        total_orders = orders.count()
        total_kg = orders.aggregate(total=Sum('quantity_kg'))['total'] or 0
        
        return {
            'summary': {
                'total_orders': total_orders,
                'total_kg': float(total_kg),
                'average_order_size': float(avg_order_size),
            },
            'status_breakdown': list(status_breakdown),
        }
    
    def generate_batch_summary_report(self):
        """Generate batch summary report"""
        batches = Batch.objects.filter(
            created_at__date__gte=self.start_date,
            created_at__date__lte=self.end_date
        )
        
        # Status breakdown
        status_breakdown = batches.values('status').annotate(
            count=Count('id'),
            total_kg=Sum('quantity_kg')
        ).order_by('-count')
        
        # Coffee type breakdown
        type_breakdown = batches.values('coffee_type').annotate(
            count=Count('id'),
            total_kg=Sum('quantity_kg')
        ).order_by('-count')
        
        # Total batches and quantity
        total_batches = batches.count()
        total_kg = batches.aggregate(total=Sum('quantity_kg'))['total'] or 0
        
        return {
            'summary': {
                'total_batches': total_batches,
                'total_kg': float(total_kg),
            },
            'status_breakdown': list(status_breakdown),
            'type_breakdown': list(type_breakdown),
        }
    
    def generate_delivery_performance_report(self):
        """Generate delivery performance report"""
        # Get deliveries in the date range
        deliveries = DeliveryTracking.objects.filter(
            created_at__date__gte=self.start_date,
            created_at__date__lte=self.end_date
        )
        
        total_deliveries = deliveries.count()
        completed_deliveries = deliveries.filter(status='DELIVERED').count()
        
        # Status breakdown
        status_breakdown = deliveries.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Dealer performance
        dealer_performance = deliveries.values(
            'dealer__username',
            'dealer__id'
        ).annotate(
            total_deliveries=Count('id'),
            completed_deliveries=Count('id', filter=Q(status='DELIVERED')),
            completion_rate=Count('id', filter=Q(status='DELIVERED')) * 100.0 / Count('id')
        ).order_by('-completed_deliveries')
        
        return {
            'summary': {
                'total_deliveries': total_deliveries,
                'completed_deliveries': completed_deliveries,
                'completion_rate': round((completed_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0, 2),
            },
            'status_breakdown': list(status_breakdown),
            'dealer_performance': list(dealer_performance[:10]),
        }
    
    def generate_revenue_report(self):
        """Generate revenue report (placeholder - requires pricing data)"""
        orders = Order.objects.filter(
            created_at__date__gte=self.start_date,
            created_at__date__lte=self.end_date,
            status='DELIVERED'
        )
        
        # Note: This is a placeholder. In a real system, you'd have pricing data
        # For now, we'll just show quantities
        total_kg_sold = orders.aggregate(total=Sum('quantity_kg'))['total'] or 0
        
        # Daily revenue (quantity-based for now)
        from django.db.models.functions import TruncDate
        daily_sales = orders.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            total_kg=Sum('quantity_kg'),
            order_count=Count('id')
        ).order_by('date')
        
        return {
            'summary': {
                'total_kg_sold': float(total_kg_sold),
                'total_orders': orders.count(),
                'note': 'Revenue calculation requires pricing data to be implemented',
            },
            'daily_sales': list(daily_sales),
        }
    
    def generate_report(self, report_type):
        """Generate report based on type"""
        generators = {
            'SALES': self.generate_sales_report,
            'INVENTORY': self.generate_inventory_report,
            'DEALER_PERFORMANCE': self.generate_dealer_performance_report,
            'CUSTOMER_ACTIVITY': self.generate_customer_activity_report,
            'ORDER_SUMMARY': self.generate_order_summary_report,
            'BATCH_SUMMARY': self.generate_batch_summary_report,
            'DELIVERY_PERFORMANCE': self.generate_delivery_performance_report,
            'REVENUE': self.generate_revenue_report,
        }
        
        generator = generators.get(report_type)
        if not generator:
            raise ValueError(f"Unknown report type: {report_type}")
        
        return generator()
