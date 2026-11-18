# Detection challenge results

Engine: `rules-1.5.0`. Dataset: INX Shield synthetic expansion set 2.

Synthetic, author-labelled development challenge set; not a held-out or independently validated real-world accuracy estimate. A warning means scam OR caution. Ambiguous examples are excluded from precision/recall and false-alarm rates. Context answers are not used.

Dataset SHA-256: `84ce7cc7487547d987c65ac52dcc715f8df86a62237fcb6bdf15be5c5015315e`

| Group | Scam warnings / scams | Missed scams | False alarms / benign | Warning recall | False-alarm rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| overall | 24/24 | 0 | 3/24 | 100.0% | 12.5% |
| en | 8/8 | 0 | 1/8 | 100.0% | 12.5% |
| ta | 8/8 | 0 | 1/8 | 100.0% | 12.5% |
| tanglish | 8/8 | 0 | 1/8 | 100.0% | 12.5% |

Warning precision: 88.9%. Likely-scam-only precision: 100.0%. These describe only the labelled synthetic cases.

## Missed scam examples

None in this set.

## False alarms

- **en-benign-08** (en; caution): Read this week's school newsletter: https://bit.ly/campus-notes
  - Label rationale: Fictional genuine shortened-link newsletter; cautious result still counts as a false alarm.

- **ta-benign-08** (ta; caution): பள்ளி வாரச் செய்திகள்: https://bit.ly/campus-tamil
  - Label rationale: Fictional genuine shortened-link newsletter; caution counts as a false alarm.

- **tanglish-benign-08** (tanglish; caution): School weekly news inga: https://bit.ly/campus-tanglish
  - Label rationale: Fictional genuine short-link newsletter; caution counts as a false alarm.

## Ambiguous examples (not scored)

- **en-ambiguous-01** (en; low): I need money for a new laptop.
  - Label rationale: Personal statement; recipient action and identity are unknown.

- **en-ambiguous-02** (en; caution): Mum, this is my new number. I need cash for rent.
  - Label rationale: Could be genuine or impersonation; wording justifies verification but identity is unknown.

- **en-ambiguous-03** (en; low): Pay your tuition online at https://college.example/pay.
  - Label rationale: Message alone cannot authenticate this payment destination.

- **en-ambiguous-04** (en; low): Please help with my bill.
  - Label rationale: Nature of help and surrounding conversation are unknown.

- **ta-ambiguous-01** (ta; low): எனக்கு வீட்டுச் செலவுக்கு பணம் வேண்டும்.
  - Label rationale: Money need without enough identity or recipient-action context.

- **ta-ambiguous-02** (ta; caution): அப்பா, இது என் புதிய எண். வாடகைக்கு பணம் வேண்டும்.
  - Label rationale: Could be a genuine relative or an impostor.

- **ta-ambiguous-03** (ta; low): கல்விக் கட்டணத்தை https://college.example/fees இங்கே செலுத்துங்கள்.
  - Label rationale: Message cannot authenticate the online payment destination.

- **ta-ambiguous-04** (ta; low): எனக்கு ஒரு உதவி செய்ய முடியுமா?
  - Label rationale: The requested action has not been stated.

- **tanglish-ambiguous-01** (tanglish; low): Enakku laptop vaanga cash venum.
  - Label rationale: Personal money need with unknown action and identity.

- **tanglish-ambiguous-02** (tanglish; caution): Amma new number idhu. Rent ku panam venum.
  - Label rationale: Could be genuine family communication or impersonation.

- **tanglish-ambiguous-03** (tanglish; caution): College fees online la pay pannunga https://college.example/fee
  - Label rationale: Payment destination is unauthenticated.

- **tanglish-ambiguous-04** (tanglish; low): Bro konjam help pannunga.
  - Label rationale: The type of help is unstated.
