from dataclasses import dataclass


@dataclass(frozen=True)
class EmailMessage:
    to: str
    subject: str
    template: str
    context: dict


class EmailProvider:
    def send(self, message: EmailMessage) -> None:
        raise NotImplementedError


class LogEmailProvider(EmailProvider):
    def send(self, message: EmailMessage) -> None:
        print(f"EMAIL {message.template} -> {message.to}: {message.subject}")


class EmailService:
    def __init__(self, provider: EmailProvider | None = None):
        self.provider = provider or LogEmailProvider()

    def send_order_shipped(self, to: str, order_number: str, tracking_number: str | None) -> None:
        self.provider.send(
            EmailMessage(
                to=to,
                subject=f"Nexora order {order_number} shipped",
                template="order_shipped",
                context={"order_number": order_number, "tracking_number": tracking_number},
            )
        )

