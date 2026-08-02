from fastapi import APIRouter
from fastapi.responses import PlainTextResponse, Response

from app.core.config import settings

router = APIRouter(tags=["SEO"])


@router.get("/robots.txt", response_class=PlainTextResponse)
def robots() -> str:
    return "User-agent: *\nAllow: /\nSitemap: {}/sitemap.xml\n".format(str(settings.frontend_url).rstrip("/"))


@router.get("/sitemap.xml")
def sitemap() -> Response:
    base_url = str(settings.frontend_url).rstrip("/")
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>{base_url}/</loc></url>
  <url><loc>{base_url}/catalog</loc></url>
  <url><loc>{base_url}/about</loc></url>
  <url><loc>{base_url}/faq</loc></url>
  <url><loc>{base_url}/shipping-policy</loc></url>
  <url><loc>{base_url}/returns-policy</loc></url>
</urlset>
"""
    return Response(content=xml, media_type="application/xml")

