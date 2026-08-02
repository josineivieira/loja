from abc import ABC, abstractmethod
from typing import Any


class SupplierProvider(ABC):
    @abstractmethod
    def authenticate(self) -> bool:
        raise NotImplementedError

    @abstractmethod
    def search_products(self, query: str) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def get_product(self, supplier_product_id: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def get_variants(self, supplier_product_id: str) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def get_inventory(self, supplier_variant_id: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def calculate_shipping(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def create_supplier_order(self, order_payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def get_supplier_order(self, supplier_order_id: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def cancel_supplier_order(self, supplier_order_id: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def get_tracking(self, tracking_number: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def sync_product(self, supplier_product_id: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def sync_stock(self, supplier_variant_id: str) -> dict[str, Any]:
        raise NotImplementedError

