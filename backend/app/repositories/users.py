import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.role import Role, UserRole
from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).options(selectinload(User.roles).selectinload(UserRole.role)).where(User.email == email)
        return self.db.scalar(statement)

    def get_by_id(self, user_id: str | uuid.UUID) -> User | None:
        parsed_id = uuid.UUID(str(user_id))
        statement = select(User).options(selectinload(User.roles).selectinload(UserRole.role)).where(User.id == parsed_id)
        return self.db.scalar(statement)

    def get_or_create_role(self, name: str, description: str | None = None) -> Role:
        role = self.db.scalar(select(Role).where(Role.name == name))
        if role:
            return role
        role = Role(name=name, description=description)
        self.db.add(role)
        self.db.flush()
        return role

    def create_user(self, user: User, role_names: list[str]) -> User:
        self.db.add(user)
        self.db.flush()
        for role_name in role_names:
            role = self.get_or_create_role(role_name)
            self.db.add(UserRole(user_id=user.id, role_id=role.id))
        self.db.commit()
        self.db.refresh(user)
        return self.get_by_email(user.email) or user
