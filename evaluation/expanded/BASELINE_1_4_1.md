# Detection challenge results

Engine: `rules-1.4.1`. Dataset: INX Shield synthetic expansion set 2.

Synthetic, author-labelled development challenge set; not a held-out or independently validated real-world accuracy estimate. A warning means scam OR caution. Ambiguous examples are excluded from precision/recall and false-alarm rates. Context answers are not used.

Dataset SHA-256: `84ce7cc7487547d987c65ac52dcc715f8df86a62237fcb6bdf15be5c5015315e`

| Group | Scam warnings / scams | Missed scams | False alarms / benign | Warning recall | False-alarm rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| overall | 13/24 | 11 | 12/24 | 54.2% | 50.0% |
| en | 5/8 | 3 | 4/8 | 62.5% | 50.0% |
| ta | 4/8 | 4 | 4/8 | 50.0% | 50.0% |
| tanglish | 4/8 | 4 | 4/8 | 50.0% | 50.0% |

Warning precision: 52.0%. Likely-scam-only precision: 100.0%. These describe only the labelled synthetic cases.

## Missed scam examples

- **en-scam-01** (en; low): Mum, this is my replacement number. My handset broke and I need some money for a repair.
  - Label rationale: Fictional impostor uses a changed-number story and an indirect money request.

- **en-scam-02** (en; low): Dad, I lost my phone. Can you help me with some cash for the hospital?
  - Label rationale: Fictional family impostor asks indirectly for cash.

- **en-scam-03** (en; low): Hello sister, new mobile number here. I need funds for a bill; please help me.
  - Label rationale: Fictional changed-number money request.

- **ta-scam-01** (ta; low): அப்பா, இது என் புதிய எண். போன் தொலைந்துவிட்டது. செலவுக்கு கொஞ்சம் பணம் வேண்டும்.
  - Label rationale: Fictional Tamil family impostor uses new-number and money-need wording.

- **ta-scam-02** (ta; low): அம்மா, பழைய போன் உடைந்துவிட்டது. இது புது நம்பர். நண்பருக்கு உதவ பணம் தேவை.
  - Label rationale: Fictional broken-phone story with an indirect money request.

- **ta-scam-03** (ta; low): அக்கா, இந்த புதிய எண்ணில் பேசுகிறேன். கொஞ்சம் காசு வேணும், உதவி பண்ணுங்க.
  - Label rationale: Fictional Tamil changed-contact request using colloquial cash wording.

- **ta-scam-04** (ta; low): எனக்கு பணத்தை அனுப்புங்கள், பதிவு முடிக்க வேண்டும்.
  - Label rationale: Fictional scam request using inflected Tamil money wording.

- **tanglish-scam-01** (tanglish; low): Appa idhu en new number. Old phone broken. Konjam panam venum.
  - Label rationale: Fictional family impostor using Tanglish money-need wording.

- **tanglish-scam-02** (tanglish; low): Amma pudhu number idhu. Friend ku kaasu thevai, help pannunga.
  - Label rationale: Fictional changed-number request with a spelling variant.

- **tanglish-scam-03** (tanglish; low): Akka phone tholainjuruchu, new mobile number. Cash venum help pannunga.
  - Label rationale: Fictional lost-phone story and indirect cash request.

- **tanglish-scam-04** (tanglish; low): Enakku cash transfer pannunga for registration.
  - Label rationale: Fictional remote transfer request with money-before-verb order.

## False alarms

- **en-benign-01** (en; caution): Please pay the tuition fee at the college office on Friday.
  - Label rationale: Fictional legitimate in-person tuition payment reminder.

- **en-benign-02** (en; caution): Pay the library fee in person at the school counter and collect a receipt.
  - Label rationale: Fictional legitimate in-person fee with receipt.

- **en-benign-03** (en; caution): At the college office, pay the exam fee tomorrow.
  - Label rationale: Fictional legitimate counter payment with the place before the request.

- **en-benign-08** (en; caution): Read this week's school newsletter: https://bit.ly/campus-notes
  - Label rationale: Fictional genuine shortened-link newsletter; cautious result still counts as a false alarm.

- **ta-benign-01** (ta; caution): பள்ளி அலுவலகத்தில் கல்விக் கட்டணம் செலுத்துங்கள்.
  - Label rationale: Fictional legitimate fee at a school office.

- **ta-benign-02** (ta; caution): கல்லூரி அலுவலகத்தில் தேர்வுக் கட்டணத்தை செலுத்துங்கள்.
  - Label rationale: Fictional legitimate exam fee paid at the college office.

- **ta-benign-03** (ta; caution): பள்ளி அலுவலகத்தில் கட்டணம் செலுத்தி ரசீது பெறுங்கள்.
  - Label rationale: Fictional legitimate in-person fee and receipt.

- **ta-benign-08** (ta; caution): பள்ளி வாரச் செய்திகள்: https://bit.ly/campus-tamil
  - Label rationale: Fictional genuine shortened-link newsletter; caution counts as a false alarm.

- **tanglish-benign-01** (tanglish; caution): School office la exam fee kattunga, receipt vangikonga.
  - Label rationale: Fictional legitimate school office fee reminder.

- **tanglish-benign-02** (tanglish; caution): College fee office counter la seluthunga.
  - Label rationale: Fictional legitimate counter payment with reversed word order.

- **tanglish-benign-03** (tanglish; caution): College office counter la fees pay pannunga.
  - Label rationale: Fictional legitimate office payment with plural fees.

- **tanglish-benign-08** (tanglish; caution): School weekly news inga: https://bit.ly/campus-tanglish
  - Label rationale: Fictional genuine short-link newsletter; caution counts as a false alarm.

## Ambiguous examples (not scored)

- **en-ambiguous-01** (en; low): I need money for a new laptop.
  - Label rationale: Personal statement; recipient action and identity are unknown.

- **en-ambiguous-02** (en; low): Mum, this is my new number. I need cash for rent.
  - Label rationale: Could be genuine or impersonation; wording justifies verification but identity is unknown.

- **en-ambiguous-03** (en; low): Pay your tuition online at https://college.example/pay.
  - Label rationale: Message alone cannot authenticate this payment destination.

- **en-ambiguous-04** (en; low): Please help with my bill.
  - Label rationale: Nature of help and surrounding conversation are unknown.

- **ta-ambiguous-01** (ta; low): எனக்கு வீட்டுச் செலவுக்கு பணம் வேண்டும்.
  - Label rationale: Money need without enough identity or recipient-action context.

- **ta-ambiguous-02** (ta; low): அப்பா, இது என் புதிய எண். வாடகைக்கு பணம் வேண்டும்.
  - Label rationale: Could be a genuine relative or an impostor.

- **ta-ambiguous-03** (ta; low): கல்விக் கட்டணத்தை https://college.example/fees இங்கே செலுத்துங்கள்.
  - Label rationale: Message cannot authenticate the online payment destination.

- **ta-ambiguous-04** (ta; low): எனக்கு ஒரு உதவி செய்ய முடியுமா?
  - Label rationale: The requested action has not been stated.

- **tanglish-ambiguous-01** (tanglish; low): Enakku laptop vaanga cash venum.
  - Label rationale: Personal money need with unknown action and identity.

- **tanglish-ambiguous-02** (tanglish; low): Amma new number idhu. Rent ku panam venum.
  - Label rationale: Could be genuine family communication or impersonation.

- **tanglish-ambiguous-03** (tanglish; caution): College fees online la pay pannunga https://college.example/fee
  - Label rationale: Payment destination is unauthenticated.

- **tanglish-ambiguous-04** (tanglish; low): Bro konjam help pannunga.
  - Label rationale: The type of help is unstated.
