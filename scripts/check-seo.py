"""Check the HTML delivered before JavaScript, canonical URLs and structured data."""
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent
dist = root / "dist"
config = json.loads((root / "content/seo.json").read_text())

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.refs = []
        self.local_files = []
        self.metadata = {}
        self.canonical = []
        self.headings = []
        self.schema = ""
        self.in_schema = False
        self.in_h1 = False
        self.in_name = False
        self.h1 = ""
        self.names = []
    def handle_starttag(self, tag, attributes):
        a = dict(attributes)
        if "id" in a:
            assert a["id"] not in self.ids, f"Duplicate ID: {a['id']}"
            self.ids.add(a["id"])
        if tag == "meta":
            key = a.get("name", a.get("property"))
            if key:
                assert key not in self.metadata, f"Duplicate meta tag: {key}"
                self.metadata[key] = a.get("content", "")
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical.append(a["href"])
        if tag == "h1":
            self.in_h1 = True
            self.headings.append(a)
        if tag == "h4" and a.get("class") == "service-name":
            self.in_name = True
            self.names.append("")
        if tag == "script" and a.get("type") == "application/ld+json":
            self.in_schema = True
        for attr in ["aria-controls", "aria-labelledby"]:
            self.refs.extend(a.get(attr, "").split())
        for attr in ["src", "href"]:
            value = a.get(attr, "")
            if value.startswith("#"):
                self.refs.append(value[1:])
            elif value and not urlsplit(value).scheme and not value.startswith("/"):
                self.local_files.append(unquote(value))
        for item in a.get("srcset", a.get("imagesrcset", "")).split(","):
            if item.strip():
                self.local_files.append(item.strip().split()[0])
    def handle_endtag(self, tag):
        if tag == "h1": self.in_h1 = False
        if tag == "h4": self.in_name = False
        if tag == "script": self.in_schema = False
    def handle_data(self, data):
        if self.in_h1: self.h1 += data
        if self.in_name: self.names[-1] += data
        if self.in_schema: self.schema += data

page = Page()
page.feed((dist / "index.html").read_text())
assert len(page.headings) == 1 and all(word in page.h1.casefold() for word in ("адлер", "маникюр", "педикюр", "брови"))
assert page.canonical == [config["url"]]
assert page.metadata["description"] == config["description"]
assert page.metadata["og:url"] == config["url"]
assert page.metadata["robots"] == "index, follow, max-image-preview:large"
for ref in page.refs:
    assert ref in page.ids, f"Broken anchor / accessible control: {ref}"
for file in page.local_files:
    assert (dist / file).is_file(), f"Missing local asset: {file}"
expected = [item["name"] for group in config["services"] for item in group["items"]]
assert page.names == expected, "All 16 services must be in the HTML before JavaScript."
graph = json.loads(page.schema)["@graph"]
salon = next(node for node in graph if node["@type"] == "NailSalon")
assert salon["telephone"] == config["business"]["telephone"]
assert salon["address"]["streetAddress"] == config["business"]["streetAddress"]
assert len(salon["openingHoursSpecification"][0]["dayOfWeek"]) == 7
catalog = next(node for node in graph if node["@type"] == "OfferCatalog")
offers = [item for group in catalog["itemListElement"] for item in group["itemListElement"]]
assert [offer["itemOffered"]["name"] for offer in offers] == expected
for offer, item in zip(offers, [i for group in config["services"] for i in group["items"]]):
    actual = offer.get("price", offer.get("priceSpecification", {}).get("minPrice"))
    assert int(actual) == item["price"]
assert "aggregateRating" not in salon, "Do not advertise a self-serving third-party rating."
sitemap = ET.fromstring((dist / "sitemap.xml").read_text())
locations = [node.text for node in sitemap.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
assert locations == [config["url"]]
assert f"Sitemap: {config['url']}sitemap.xml" in (dist / "robots.txt").read_text()
assert "Disallow: /" not in (dist / "robots.txt").read_text()
print("SEO verified: one visible-topic H1, metadata, canonical, 16 static services, matching structured prices, local business, anchors, image variants, robots.txt and sitemap.xml.")
