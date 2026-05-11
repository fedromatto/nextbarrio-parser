# Area Mapping Logic

## Column structure

Any property table that stores location data uses **three columns**:

| Column | What it stores | Example |
|---|---|---|
| `macro_area` | District (top-level) | `Eixample` |
| `area` | Canonical sub-area / neighbourhood | `Sant Antoni` |
| `area_parsed` | Raw string from the listing, untouched | `"Eixample Sant Antoni"` |

`area_parsed` is never modified — it's a historical record of what the listing said.
`macro_area` and `area` are the clean, canonical values used for matching and filtering.

---

## Canonical values

### Macro areas (districts)

| Macro area | Sub-areas |
|---|---|
| Ciutat Vella | Gothic Quarter, El Raval, El Born, Barceloneta |
| Eixample | Eixample, Sant Antoni, Sagrada Família |
| Gràcia | Gràcia |
| Sants-Montjuïc | Sants, Poble-sec, Montjuïc |
| Les Corts | Les Corts |
| Sarrià-Sant Gervasi | Sarrià-Sant Gervasi |
| Horta-Guinardó | Horta-Guinardó |
| Nou Barris | Nou Barris |
| Sant Andreu | Sant Andreu |
| Sant Martí | Poblenou, Sant Martí |
| Hospitalet | Hospitalet |

When a macro area has only one sub-area with the same name (e.g. Gràcia, Horta-Guinardó, Hospitalet), both `macro_area` and `area` are set to that same string.

---

## Mapping rules (in priority order)

### 1. Exact sub-area match on `area_parsed`

Try to map the raw `area_parsed` string to a canonical sub-area. Common known variants:

**Ciutat Vella**
- `el born`, `born`, `la ribera`, `sant pere`, `santa caterina` → **El Born**
- `barri gòtic`, `barri gotic`, `gòtic`, `gotic`, `gothic quarter`, `el gòtic` → **Gothic Quarter**
- `el raval`, `raval` → **El Raval**
- `barceloneta`, `la barceloneta` → **Barceloneta**

**Eixample**
- `eixample`, `l'eixample`, `dreta de l'eixample`, `esquerra de l'eixample`, `nova esquerra de l'eixample`, `antiga esquerra de l'eixample`, `l'antiga esquerra de l'eixample` → **Eixample**
- `sant antoni` → **Sant Antoni**
- `sagrada família`, `sagrada familia`, `la sagrada família` → **Sagrada Família**
- `fort pienc` → sub-area null (macro = Eixample, no canonical sub-area)

**Gràcia**
- `gràcia`, `gracia`, `vila de gràcia`, `camp d'en grassot` → **Gràcia**

**Sants-Montjuïc**
- `sants`, `sants-badal`, `hostafrancs`, `sants` → **Sants**
- `poble sec`, `poble-sec`, `el poble sec` → **Poble-sec**
- `montjuïc`, `montjuic` → **Montjuïc**

**Les Corts**
- `les corts`, `pedralbes`, `la maternitat` → **Les Corts**

**Sarrià-Sant Gervasi**
- `sarrià-sant gervasi`, `sarria-sant gervasi`, `sarrià`, `sarria`, `sant gervasi`, `les tres torres`, `el putxet`, `sant gervasi - la bonanova` → **Sarrià-Sant Gervasi**

**Horta-Guinardó**
- `horta-guinardó`, `horta`, `guinardó`, `guinardo` → **Horta-Guinardó**

**Nou Barris**
- `nou barris` → **Nou Barris**

**Sant Andreu**
- `sant andreu` → **Sant Andreu**

**Sant Martí**
- `poblenou`, `el poblenou`, `poble nou`, `la vila olímpica`, `vila olímpica`, `rambla del poblenou`, `poblenou` (ILIKE) → **Poblenou**
- `sant martí`, `sant marti`, `el clot`, `camp de l'arpa`, `el parc i la llacuna` → **Sant Martí**

**Hospitalet**
- `hospitalet`, `l'hospitalet`, `l'hospitalet de llobregat`, `hospitalet de llobregat` → **Hospitalet**

---

### 2. Fallback from old `area` slug

If `area_parsed` didn't match, derive a default sub-area from the old lowercase slug stored in `area`:

| Old slug | → `area` (sub-area) | → `macro_area` |
|---|---|---|
| `born` | El Born | Ciutat Vella |
| `gotico` | Gothic Quarter | Ciutat Vella |
| `raval` | El Raval | Ciutat Vella |
| `barceloneta` | Barceloneta | Ciutat Vella |
| `eixample` | Eixample | Eixample |
| `sant antoni` | Sant Antoni | Eixample |
| `sagrada familia` | Sagrada Família | Eixample |
| `fort pienc` | *(null)* | Eixample |
| `gracia` | Gràcia | Gràcia |
| `sants` | Sants | Sants-Montjuïc |
| `poble sec` | Poble-sec | Sants-Montjuïc |
| `poble nou` | Poblenou | Sant Martí |
| `el clot` | Sant Martí | Sant Martí |
| `horta` | Horta-Guinardó | Horta-Guinardó |
| `sarria` | Sarrià-Sant Gervasi | Sarrià-Sant Gervasi |
| `sant andreu` | Sant Andreu | Sant Andreu |
| `hospitalet` | Hospitalet | Hospitalet |

---

### 3. Pattern-based fixes (ILIKE)

After the exact-match passes, run pattern-based UPDATE statements for free-text values that contain a district/neighbourhood name as a substring. **Order matters — more specific patterns before generic ones.**

| Pattern | `area` | `macro_area` |
|---|---|---|
| `ILIKE '%sarri%sant gervasi%'` or `ILIKE '%sarrià%'` | Sarrià-Sant Gervasi | Sarrià-Sant Gervasi |
| `ILIKE '%sants%montju%'` | *(unchanged)* | Sants-Montjuïc |
| `ILIKE '%hostafrancs%'` | Sants | Sants-Montjuïc |
| `ILIKE '%les corts%'` | Les Corts | Les Corts |
| `LOWER = 'ciutat vella'` | *(unchanged)* | Ciutat Vella |
| `ILIKE '%eixample%sant anton%'` ← **must come first** | Sant Antoni | Eixample |
| `ILIKE '%eixample%'` (catch-all) | Eixample | Eixample |
| `ILIKE '%poble sec%'` | Poble-sec | Sants-Montjuïc |
| `ILIKE '%raval%'` | El Raval | Ciutat Vella |
| `ILIKE '%gotico%'` or `ILIKE '%gòtic%'` | Gothic Quarter | Ciutat Vella |
| `ILIKE '%sants%'` | Sants | Sants-Montjuïc |
| `ILIKE '%poblenou%'` | Poblenou | Sant Martí |
| `ILIKE '%hospitalet%'` | Hospitalet | Hospitalet |

The Eixample Sant Antoni rule **must always be placed before** the generic Eixample catch-all, otherwise `"Eixample Sant Antoni"` would be mapped to sub-area `Eixample` instead of `Sant Antoni`.

### 3b. Canonical-area-only patch (macro_area still null)

Some rows already have a canonical `area` value (set by a previous migration or the parser) but `macro_area` is still null because none of the ILIKE patterns matched the canonical string. Fix with exact equality checks **after** the pattern rules:

| `area =` | `macro_area` |
|---|---|
| `Sagrada Família` | Eixample |
| `Poble-sec` | Sants-Montjuïc |

Add similar exact-equality patches whenever a new sub-area's canonical name is not caught by any ILIKE pattern.

---

### 4. Last resort

If nothing matched, set `area` to the raw `area_parsed` string as-is (better than null).

---

## Matching logic (application layer)

When checking if a property matches a client's `preferred_areas`:

- If the client selected a **macro area** → match any property whose `macro_area` equals it (regardless of `area`)
- If the client selected a **sub-area** → match properties whose `area` equals it; if the property has no `area`, also accept if `macro_area` equals the sub-area's parent district
- Matching is case-insensitive

This means selecting `Eixample` matches properties in Eixample, Sant Antoni, and Sagrada Família. Selecting `Sant Antoni` only matches Sant Antoni (unless the property has no sub-area, in which case Eixample is accepted as a fallback).

---

## Adding a new area

1. Add the macro area to `MACRO_AREAS` in `src/lib/supabase.ts`
2. Add any sub-areas to `SUBAREAS` and `MACRO_TO_SUBAREAS`
3. Add a color in `AREA_COLORS`
4. Add exact-match variants to the migration CASE blocks
5. Add ILIKE pattern rules if the area name appears as a substring in free-text data
6. Add to the parser's `MACRO_AREAS` / `SUBAREAS` lists and Claude prompt mappings
7. Update this file
