from decimal import Decimal

from app.core.config import settings
from app.database.session import SessionLocal
from app.models.category import Category
from app.models.engagement import Notification, Review
from app.models.order import Coupon, ShippingMethod
from app.models.product import Product, ProductImage, ProductVariant
from app.models.supplier import Supplier
from app.models.user import User
from app.repositories.users import UserRepository
from app.security.passwords import hash_password


def seed() -> None:
    db = SessionLocal()
    try:
        users = UserRepository(db)
        for role in ["customer", "admin", "manager", "support"]:
            users.get_or_create_role(role)

        if settings.admin_password and not users.get_by_email(settings.admin_email):
            admin = User(
                email=settings.admin_email,
                first_name="Nexora",
                last_name="Admin",
                password_hash=hash_password(settings.admin_password),
                is_email_verified=True,
            )
            users.create_user(admin, ["admin"])

        supplier = db.query(Supplier).filter_by(code="manual-cj").first()
        if not supplier:
            supplier = Supplier(name="Manual CJ Dropshipping", code="manual-cj", notes="Manual provider placeholder")
            db.add(supplier)
            db.flush()

        shipping_methods = [
            ShippingMethod(name="Standard Shipping", code="standard", countries=[], min_days=10, max_days=20, amount=Decimal("9.90"), free_over_amount=Decimal("100.00")),
            ShippingMethod(name="Express Shipping", code="express", countries=[], min_days=5, max_days=9, amount=Decimal("19.90")),
            ShippingMethod(name="Free Shipping", code="free", countries=[], min_days=12, max_days=24, amount=Decimal("0.00"), free_over_amount=Decimal("0.00")),
        ]
        for method in shipping_methods:
            if not db.query(ShippingMethod).filter_by(code=method.code).first():
                db.add(method)

        coupons = [
            Coupon(code="WELCOME10", name="Welcome 10 percent", discount_type="percent", value=Decimal("10.00"), minimum_amount=Decimal("25.00")),
            Coupon(code="NEXORA5", name="Nexora fixed discount", discount_type="fixed", value=Decimal("5.00"), minimum_amount=Decimal("30.00")),
        ]
        for coupon in coupons:
            if not db.query(Coupon).filter_by(code=coupon.code).first():
                db.add(coupon)

        categories = [
            Category(name="Smart Home", slug="smart-home", description="Connected devices for modern homes", sort_order=1),
            Category(name="Travel Tech", slug="travel-tech", description="Portable electronics for global travelers", sort_order=2),
            Category(name="Workspace", slug="workspace", description="Premium desk and productivity gadgets", sort_order=3),
        ]
        for category in categories:
            if not db.query(Category).filter_by(slug=category.slug).first():
                db.add(category)
        db.flush()

        category = db.query(Category).filter_by(slug="smart-home").first()
        category_by_slug = {item.slug: item for item in db.query(Category).all()}
        seed_products = [
            {
                "category_slug": "smart-home",
                "name": "Nexora Smart Hub Mini",
                "slug": "nexora-smart-hub-mini",
                "short_description": "A compact control hub for everyday connected living.",
                "description": "Control compatible lighting, plugs and sensors from one clean command center.",
                "sku": "NX-SH-MINI",
                "supplier_sku": "CJ-MANUAL-SH-MINI",
                "supplier_product_id": "manual-cj-smart-hub-mini",
                "cost_price": Decimal("18.00"),
                "sale_price": Decimal("49.00"),
                "compare_at_price": Decimal("69.00"),
                "featured": True,
                "is_new": True,
                "is_bestseller": True,
                "image": "https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=900&q=80",
                "variants": [("NX-SH-MINI-BLK-US", "49.00", "18.00", 120), ("NX-SH-MINI-WHT-EU", "49.00", "18.00", 85)],
            },
            {
                "category_slug": "travel-tech",
                "name": "Nexora FoldCharge Pro",
                "slug": "nexora-foldcharge-pro",
                "short_description": "Foldable wireless charging station for phone, watch and earbuds.",
                "description": "A travel-ready charging system with a stable hinge, compact footprint and multi-device support.",
                "sku": "NX-FC-PRO",
                "supplier_sku": "CJ-MANUAL-FC-PRO",
                "supplier_product_id": "manual-cj-foldcharge-pro",
                "cost_price": Decimal("22.00"),
                "sale_price": Decimal("59.00"),
                "compare_at_price": Decimal("79.00"),
                "featured": True,
                "is_new": False,
                "is_bestseller": True,
                "image": "https://images.unsplash.com/photo-1616410011236-7a42121dd981?auto=format&fit=crop&w=900&q=80",
                "variants": [("NX-FC-PRO-BLK", "59.00", "22.00", 96), ("NX-FC-PRO-SLV", "59.00", "22.00", 70)],
            },
            {
                "category_slug": "workspace",
                "name": "Nexora DeskBeam Light Bar",
                "slug": "nexora-deskbeam-light-bar",
                "short_description": "Monitor light bar with glare control and adjustable temperature.",
                "description": "Designed for focused work sessions with USB-C power, smooth dimming and a clean desk profile.",
                "sku": "NX-DB-LIGHT",
                "supplier_sku": "CJ-MANUAL-DB-LIGHT",
                "supplier_product_id": "manual-cj-deskbeam-light",
                "cost_price": Decimal("28.00"),
                "sale_price": Decimal("74.00"),
                "compare_at_price": None,
                "featured": False,
                "is_new": True,
                "is_bestseller": False,
                "image": "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=900&q=80",
                "variants": [("NX-DB-LIGHT-BLK", "74.00", "28.00", 44)],
            },
        ]

        for item in seed_products:
            product = db.query(Product).filter_by(slug=item["slug"]).first()
            category = category_by_slug.get(item["category_slug"])
            if not product and category:
                product = Product(
                    category_id=category.id,
                    supplier_id=supplier.id,
                    name=item["name"],
                    slug=item["slug"],
                    short_description=item["short_description"],
                    description=item["description"],
                    sku=item["sku"],
                    supplier_sku=item["supplier_sku"],
                    supplier_product_id=item["supplier_product_id"],
                    cost_price=item["cost_price"],
                    sale_price=item["sale_price"],
                    compare_at_price=item["compare_at_price"],
                    status="active",
                    featured=item["featured"],
                    is_new=item["is_new"],
                    is_bestseller=item["is_bestseller"],
                )
                db.add(product)
                db.flush()
                db.add(ProductImage(product_id=product.id, url=item["image"], alt_text=item["name"], is_primary=True))
                for sku, price, cost, stock in item["variants"]:
                    db.add(ProductVariant(product_id=product.id, sku=sku, price=Decimal(price), cost=Decimal(cost), stock=stock, status="active"))

        first_product = db.query(Product).filter_by(slug="nexora-smart-hub-mini").first()
        if first_product and not db.query(Review).filter_by(product_id=first_product.id).first():
            db.add(
                Review(
                    product_id=first_product.id,
                    customer_name="Maya Chen",
                    rating=5,
                    title="Clean and premium",
                    comment="The finish feels better than most gadget shops I have tried.",
                    status="approved",
                    verified_purchase=True,
                    admin_reply="Thank you for choosing Nexora.",
                )
            )
        if not db.query(Notification).first():
            db.add(Notification(title="Order awaiting supplier", message="Manual CJ submission queue is ready for review.", type="supplier_pending"))

        db.commit()
        print("Seed completed")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
