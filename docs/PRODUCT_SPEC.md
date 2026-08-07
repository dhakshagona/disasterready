# DisasterReady Product Specification

## Product statement

DisasterReady helps a person answer three questions during a weather emergency:

1. What is happening?
2. What should I do right now?
3. Where can I go safely?

## Primary users

- U.S. residents in disaster-prone areas
- Teens and families
- English learners
- People who need clear, low-stress instructions
- Users with accessibility needs

## Core promise

An official alert is transformed into a concise, prioritized, reviewed action plan without hiding or replacing the original alert.

## MVP user journey

### First launch

1. User sees the DisasterReady brand and purpose.
2. User can continue as a guest.
3. User selects relevant hazards.
4. User chooses a location method:
   - Current device location
   - Saved city or ZIP code
5. User chooses notification and accessibility preferences.
6. User lands on Home.

### No active alert

Home displays:

- Clear “No active alerts” state
- Last update time
- Selected location
- Manual refresh as a secondary recovery control
- Preparedness shortcuts
- Clearly labeled demo-mode entry for testing

### Active alert

Home prioritizes:

- Hazard and severity
- A plain-language summary
- Issue and expiration times
- Official source
- Top three “Do now” actions
- Start action plan
- Find verified shelter or safety resource
- View original alert
- Share status

### Action plan

The user can:

- View ordered, reviewed actions
- Mark individual actions complete
- Preserve progress offline
- Reset progress
- Export or share a summary later
- See which official guidance informed the plan

### Shelter and routing

The user can:

- See only locations verified as open or otherwise clearly categorized
- See source and last-updated time
- See distance and available metadata
- Open the destination in Apple Maps or Google Maps
- See a clear “No verified open shelter found” state

### Alerts

The user can view:

- Current alerts
- Recently expired alerts
- Cached alerts when offline
- Original official alert details

### Settings

The user can manage:

- Saved locations
- Hazard interests
- Notifications
- Language
- Text size
- High contrast
- Plain-language mode
- Data and privacy
- Optional account
- Demo mode

## Authentication

Authentication is optional for the MVP.

Guest users can:

- View alerts
- Save local preferences
- Use action plans
- Find shelters
- Use offline cached content

Accounts may later provide:

- Cross-device synchronization
- Multiple household locations
- Cloud-saved preferences
- Shared household status

## Real versus demo data

Demo mode must:

- Be visibly labeled on every affected screen
- Never trigger a real emergency notification
- Never be stored as a real alert
- Be easy to reset
- Exercise the complete alert-to-action flow

## Accessibility

Minimum requirements:

- Screen-reader labels
- Logical focus order
- Large tap targets
- Dynamic type support
- High-contrast option
- Plain-language option
- No critical meaning communicated by color alone
- Reduced-motion compatibility
- English architecture prepared for Spanish localization

## Privacy

- No continuous location history
- No mandatory account
- Store only what supports the product
- Explain why location and notifications are requested
- Allow deletion of local and cloud data
- Do not sell or expose user location data

## Out of scope for the first release

- Internal turn-by-turn navigation
- Social network
- Crowdsourced shelter verification
- AI-generated emergency instructions
- International alert systems
- Continuous background location tracking
- Phone OTP authentication
- Complex household coordination
- Predictive disaster forecasting
