import re


def detect_brands(response_text, brand_list):
    """
    Detect brand mentions in a single response.
    Returns:
        - mentioned_brands (set)
        - first_mentioned_brand (string or None)
    """

    mentioned_brands = set()
    first_mentioned_brand = None

    lower_response = response_text.lower()

    earliest_pos = float('inf')

    for brand in brand_list:
        pattern = r'\b' + re.escape(brand.lower()) + r'\b'
        match = re.search(pattern, lower_response)

        if match:
            mentioned_brands.add(brand)

            if match.start() < earliest_pos:
                earliest_pos = match.start()
                first_mentioned_brand = brand

    return mentioned_brands, first_mentioned_brand