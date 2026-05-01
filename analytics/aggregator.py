from collections import defaultdict
from analytics.brand_detector import detect_brands
from config.brands import BRANDS


def aggregate_metrics(data):
    """
    Computes:
    - Total brand mentions (Share of Voice)
    - First mention count
    - Stage-wise brand mentions
    """

    total_mentions = defaultdict(int)
    first_mentions = defaultdict(int)
    stage_mentions = defaultdict(lambda: defaultdict(int))

    for entry in data:
        response = entry["response"]
        stage = entry["stage"]

        mentioned_brands, first_brand = detect_brands(response, BRANDS)

        # Count total mentions (1 per brand per response)
        for brand in mentioned_brands:
            total_mentions[brand] += 1
            stage_mentions[stage][brand] += 1

        # Count first mention
        if first_brand:
            first_mentions[first_brand] += 1

    return total_mentions, first_mentions, stage_mentions


def aggregate_tone_by_stage(data):
    """
    Computes tone distribution per stage
    """

    stage_tone_distribution = defaultdict(lambda: defaultdict(int))

    for entry in data:
        stage = entry["stage"]
        tone = entry["tone"]

        stage_tone_distribution[stage][tone] += 1

    return stage_tone_distribution