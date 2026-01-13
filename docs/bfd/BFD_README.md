# Brown Family Dietitian (BFD)

Recipe management system customized for the Brown family's dietary needs.

## Family Dietary Requirements

### MTHFR Gene Mutations (All Family Members)
- **Dad (Alex, 48)**: Homozygous A1298C, BH4 pathway issues, currently eating low sulfur
- **Mom (Victoria, 44)**: MTHFR mutations, perimenopause considerations
- **Alexander**: Homozygous A1298C + C677T (most severe), histamine sensitivity

### Dietary Filters Applied

| Filter | Who | What it excludes |
|--------|-----|------------------|
| Low Sulfur | Dad | Cruciferous veggies, alliums, eggs |
| Cheese Optional | Alexander | Recipes where cheese is mandatory |
| No Histamines | Alexander | Aged foods, fermented foods, leftovers |
| MTHFR Safe | Everyone | Enriched flour, folic acid, fortified foods |
| Family Suitable | Everyone | Combines all filters |

### Food Quality Focus (SHARE Framework)
- **Everglades Ranch beef** (grass-fed, ≤3:1 omega ratio)
- **Angel Acres eggs** (truly pasture-raised, minimal grains)
- **Wild caught Alaskan salmon** (omega-3 rich)
- **Organic Valley grass-fed milk**

### Micronutrient Priorities
- **Potassium**: 3,500-4,700mg/day (90% of people deficient)
- **Magnesium**: 400-600mg/day
- **Natural Folate**: From leafy greens, legumes (avoid synthetic folic acid)
- **Omega-3:6 Ratio**: Target ≤4:1 (current 6:1)

## Recipe Sources

1. **Website recipes** (77): Scraped from nutritionbymia.com with structured data
2. **Instagram recipes** (118): Video transcriptions using Whisper AI

## Usage

### Generate Recipe Cards
```bash
python3 generate_cards.py
```
Opens `output/recipe_cards/index.html` in browser.

### Filter Buttons
- **Family Suitable**: Everyone can eat
- **Dad (Low Sulfur)**: No high-sulfur ingredients
- **Alexander OK**: No mandatory cheese
- **High Nutrient (50+)**: Nutrient density score ≥50

### Scrape More Instagram Recipes
```bash
python3 scrape_instagram.py --max 100 --kid-friendly
```

## Important Notes

### For Alexander
- **No leftovers**: Histamine levels rise as food sits
- Eat freshly cooked meals only
- Avoid aged/fermented foods

### For MTHFR
- Use almond flour, coconut flour, or other non-enriched alternatives
- Avoid "enriched" or "fortified" labeled foods
- Focus on natural folate sources (leafy greens, legumes)

## Files

- `dietary_filters.py` - Core dietary classification system
- `generate_cards.py` - HTML recipe card generator
- `scrape_website.py` - Website scraper
- `scrape_instagram.py` - Instagram scraper with kid-friendly filter
- `transcribe_videos.py` - Whisper video transcription
- `parse_transcripts.py` - Recipe extraction from transcripts
