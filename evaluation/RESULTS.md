# Detection challenge results

Engine: `rules-1.4.0`. Dataset: INX Shield synthetic challenge set 1.

Synthetic, author-labelled development challenge set; not a held-out or independently validated real-world accuracy estimate. A warning means scam OR caution. Ambiguous examples are excluded from precision/recall and false-alarm rates. Context answers are not used.

Dataset SHA-256: `486c8ea5c829dd6f7310fb61e8512e66345177020ed5e5a8c671ce70eab2506f`

| Group | Scam warnings / scams | Missed scams | False alarms / benign | Warning recall | False-alarm rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| overall | 22/24 | 2 | 6/24 | 91.7% | 25.0% |
| en | 8/8 | 0 | 2/8 | 100.0% | 25.0% |
| ta | 7/8 | 1 | 2/8 | 87.5% | 25.0% |
| tanglish | 7/8 | 1 | 2/8 | 87.5% | 25.0% |

Warning precision: 78.6%. Likely-scam-only precision: 100.0%. These describe only the labelled synthetic cases.

## Missed scam examples

- **ta-scam-07** (ta; low): அம்மா, என் பழைய போன் உடைந்துவிட்டது. இது என் புதிய எண். நண்பருக்கு உதவி செய்ய பணம் வேண்டும்.
  - Label rationale: Synthetic family impersonation with an indirect money request.

- **tanglish-scam-07** (tanglish; low): Amma old phone damage. Idhu new number. Friend ku konjam cash venum help pannunga.
  - Label rationale: Synthetic indirect family impersonation request.

## False alarms

- **en-benign-06** (en; caution): Please pay the tuition fee at the school office this week.
  - Label rationale: Synthetic legitimate tuition reminder; deliberate fee false-alarm challenge.

- **en-benign-07** (en; caution): Here is the school newsletter: https://bit.ly/class-letter
  - Label rationale: Synthetic genuine newsletter; short-link caution is a deliberate false-alarm challenge.

- **ta-benign-06** (ta; caution): பள்ளி அலுவலகத்தில் கல்வி கட்டணம் செலுத்துங்கள்.
  - Label rationale: Synthetic legitimate tuition reminder; fee false-alarm challenge.

- **ta-benign-07** (ta; caution): பள்ளி செய்திகளை இங்கே படியுங்கள்: https://bit.ly/school-ta
  - Label rationale: Synthetic genuine newsletter; short-link false-alarm challenge.

- **tanglish-benign-06** (tanglish; caution): College exam fee kattunga, office counter la receipt vangikonga.
  - Label rationale: Synthetic legitimate college fee reminder; false-alarm challenge.

- **tanglish-benign-07** (tanglish; caution): School newsletter inga iruku https://bit.ly/class-tanglish
  - Label rationale: Synthetic genuine newsletter; short-link false-alarm challenge.

## Ambiguous examples (not scored)

- **en-ambiguous-01** (en; low): You have been selected. Contact our coordinator for details.
  - Label rationale: No evidence establishes what selection or sender this is.

- **en-ambiguous-02** (en; low): Confirm your information at https://service.example/update.
  - Label rationale: A link and vague request do not authenticate the service.

- **en-ambiguous-03** (en; unclear): hi
  - Label rationale: Too little information.

- **en-ambiguous-04** (en; low): Payment pending. Please call us.
  - Label rationale: Could be a genuine reminder or an impersonation.

- **ta-ambiguous-01** (ta; low): நீங்கள் தேர்வு செய்யப்பட்டுள்ளீர்கள். விவரங்களுக்கு தொடர்பு கொள்ளுங்கள்.
  - Label rationale: Selection claim without enough context.

- **ta-ambiguous-02** (ta; low): தகவலை உறுதிசெய்யுங்கள்: https://service.example/ta
  - Label rationale: Unknown service and purpose.

- **ta-ambiguous-03** (ta; unclear): வணக்கம்
  - Label rationale: Too little information.

- **ta-ambiguous-04** (ta; low): பணம் நிலுவையில் உள்ளது. அழைக்கவும்.
  - Label rationale: Unknown payment reminder.

- **tanglish-ambiguous-01** (tanglish; low): Neenga select aagitinga. Coordinator ah contact pannunga.
  - Label rationale: Selection claim with no reliable sender context.

- **tanglish-ambiguous-02** (tanglish; low): Details confirm pannunga https://service.example/form
  - Label rationale: Unknown service and purpose.

- **tanglish-ambiguous-03** (tanglish; unclear): hi bro
  - Label rationale: Too little information.

- **tanglish-ambiguous-04** (tanglish; low): Payment pending iruku. Call pannunga.
  - Label rationale: Unknown payment reminder.
