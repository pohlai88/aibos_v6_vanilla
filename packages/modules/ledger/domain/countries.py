from enum import Enum

# countries.py
# Reference table for country, currency, UTC, and dialing code

COUNTRY_DATA = [
    {
        "country_code": "MY",
        "country_name": "Malaysia",
        "currency_code": "MYR",
        "currency_name": "Malaysian Ringgit",
        "utc_offset": "+08:00",
        "dialing_code": "+60"
    },
    {
        "country_code": "US",
        "country_name": "United States",
        "currency_code": "USD",
        "currency_name": "US Dollar",
        "utc_offset": "-05:00 to -10:00",
        "dialing_code": "+1"
    },
    {
        "country_code": "GB",
        "country_name": "United Kingdom",
        "currency_code": "GBP",
        "currency_name": "Pound Sterling",
        "utc_offset": "+00:00",
        "dialing_code": "+44"
    },
    {
        "country_code": "EU",
        "country_name": "European Union",
        "currency_code": "EUR",
        "currency_name": "Euro",
        "utc_offset": "+01:00 to +02:00",
        "dialing_code": "N/A"
    },
    # ... add more as needed ...
]

ISO_4217_CURRENCIES = {row["currency_code"] for row in COUNTRY_DATA}
COUNTRY_CODE_MAP = {row["country_code"]: row for row in COUNTRY_DATA}
CURRENCY_CODE_MAP = {row["currency_code"]: row for row in COUNTRY_DATA}


def is_valid_currency(code: str) -> bool:
    return code in ISO_4217_CURRENCIES


def get_currency_by_country(country_code: str) -> str:
    return COUNTRY_CODE_MAP.get(country_code, {}).get("currency_code")


def get_country_info(country_code: str) -> dict:
    return COUNTRY_CODE_MAP.get(country_code)


def get_country_by_currency(currency_code: str) -> dict:
    return CURRENCY_CODE_MAP.get(currency_code)


# Minimal Currency enum for import compatibility
class Currency(Enum):
    USD = 'USD'
    EUR = 'EUR'
    MYR = 'MYR'
    GBP = 'GBP'
    JPY = 'JPY'


# Minimal Country class for import compatibility
class Country:
    """Stub for Country. Extend with country code, name, and currency as needed."""
    def __init__(self, code: str = "", name: str = "", currency: str = "MYR"):
        self.code = code
        self.name = name
        self.currency = currency