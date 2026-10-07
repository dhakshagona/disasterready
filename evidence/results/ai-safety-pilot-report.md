# AI safety pilot

Generated from the first hosted evaluation batch on 2026-10-06 Pacific time.

## Scope

Forty official NWS cases were sent through the deployed Gemini simplification and safety-validation pipeline. This pilot used the original combined description-plus-instruction input. It is preserved as iteration evidence and is not the final 100-case result.

## Results

| Outcome | Count |
| --- | ---: |
| Attempted official alerts | 40 |
| Accepted model outputs | 11 |
| Safety-invalid fallback | 8 |
| Schema-invalid fallback | 20 |
| Rate-limited fallback | 1 |
| Accepted outputs passing the local safety contract | 11 of 11 |
| Dangerous contradictions delivered | 0 |

Accepted cases had a mean source length of 210 characters. Schema-invalid cases had a mean source length of 1,493 characters and ranged from 647 to 6,841 characters. This showed that the feature was sending full NWS descriptions even when a separate official instruction was available.

## Resulting change

The application now sends the official NWS `instruction` field to Gemini when present. The full official description and instruction remain unchanged and visible in Alert Detail. When the instruction field is absent, the official description remains the fallback source. Every output still passes the shared schema and safety contract on the server and client, and every failure still returns deterministic content.

The refreshed 100-case dataset stores an input hash. Earlier attempts cannot be counted against changed input text.
