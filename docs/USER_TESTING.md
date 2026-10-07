# User-testing package

## Current evidence status

No moderated user sessions have been run for this implementation. This document is a ready-to-run protocol and does not invent findings.

Operational templates:

- [Session record](user-testing/SESSION_TEMPLATE.md)
- [Observation sheet](user-testing/OBSERVATION_SHEET.csv)
- [Three-scenario observation template](user-testing/USABILITY_OBSERVATIONS_TEMPLATE.csv)
- [System Usability Scale response template](user-testing/SUS_RESPONSES_TEMPLATE.csv)
- [Facilitator script](user-testing/FACILITATOR_SCRIPT.md)

## Objective

Evaluate whether a person holding an iPhone-sized device during a stressful scenario can:

- distinguish live, cached, unavailable, expired, and demo information
- identify the first reviewed action within five seconds
- complete and recover checklist progress
- understand shelter source and availability limitations
- recognize optional AI wording and still find the official alert
- return from map handoff without losing task context

## Participants

Recruit 30 to 50 adults with a mix of:

- iPhone and Android familiarity
- low and high technical confidence
- corrected vision, large-text use, or screen-reader use where possible
- prior and no prior emergency-alert experience

Do not recruit only project contributors.

## Equipment

- iPhone with a development or production build
- Android device for responsive comparison
- 390x844 web viewport as a fallback
- screen and audio recording with consent
- observation sheet and post-task interview form

## Scenario tasks

Use the same three scenarios for every participant. Do not train participants on the interface before timing begins.

### Scenario 1: alert to action

Open a simulated flood warning, state whether it is real, find the first reviewed action, and locate the official alert source. Record unassisted completion and elapsed time.

### Scenario 2: checklist recovery

Mark two checklist items, leave the screen, return, and verify that progress remains. Then explain whether optional AI wording changes the reviewed safety actions.

### Scenario 3: safety route and trust

Find a safety destination, explain what its reported status means, then review a cached or unavailable state and explain what is known and unknown.

After all scenarios, administer the standard ten-question System Usability Scale without changing its wording or response scale.

## Observations to record

- task success without assistance
- time to first correct action
- wrong turns and recovery
- whether demo labeling is verbalized correctly
- whether stale or unavailable state is interpreted as safe
- whether shelter reporting is mistaken for guaranteed capacity
- whether AI wording is mistaken for official text
- accessibility barriers and touch errors
- participant quotes, with consent and no sensitive emergency history

## Stop conditions

Stop a task if the participant becomes distressed, believes the scenario is real, or discloses an active emergency. Clarify that the test is simulated and direct any real emergency to local authorities.

## Reporting template

For each session record device, accessibility settings, scenario outcomes, observed issues, severity, and direct evidence. Separate observation from interpretation. Use a random session code, not a name. Do not publish precise locations or recordings without consent.

Copy completed observation rows to `evidence/private/usability-observations.csv` and SUS rows to `evidence/private/usability-sus.csv`. Run `npm run evidence:usability` to produce aggregate results. The private directory is excluded from version control.

## Release criteria

- At least 30 participants complete all three scenarios.
- Every participant recognizes demo mode without prompting.
- No participant interprets failed data retrieval as an all-clear.
- At least 90% complete each scenario without assistance.
- At least 90% identify the first action within five seconds.
- Every completed session includes a valid SUS questionnaire.
- Every critical accessibility or safety-copy issue has a fix or explicit release blocker.

These thresholds are proposed criteria, not achieved results.
