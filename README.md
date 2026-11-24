# Sunrise Quest Board

The Quest Board helps people explore crew roles and sample assignments for Sunrise Fair. The illustrated field guides show what each role does from check-in to closeout.

[Open the Quest Board](https://han567-b.github.io/sunrise-quest-board/) · [Sunrise comic site](https://sunrisecomics-jd2k6wxp.manus.space/)

## What’s on the site

- **Crew roles.** Event Leads coordinate Power Runners (solar and batteries), Green Workers (setup and site operations), and Cloud Support (remote coordination and documentation). CE Vendors have a separate market path.
- **Quest browser.** Browse sample assignments by skill, experience, and reward preference. The board shows a fit score, quest details, and a sample Player Card. The featured quest includes a matching preview with example candidates.
- **Field guides.** Expand any of the five role guides to see event-day tasks and handoffs. The Power Runner guide includes 15 illustrated beats.
- **About Sunrise.** Learn about the fair’s solar power, hands-on learning, and community market.

## Signup

The Quest Board currently uses only Notion for signup. The public **Join the crew** link takes you to the test form. You can also open the form directly in Notion from that section. Use fictional details while the team updates the questions. The next event date and location are still to be announced.

End-to-end Notion response receipt has not been verified.

## Project history

See the [September deployment record](DEPLOYMENT_STATUS.md) and the [archived Apps Script guide](apps-script/README.md) for the previous intake.

## Development

- `index.html` holds the page content and Notion embed.
- `styles.css` and `refresh.css` handle layout and styling.
- `script.js` handles the quest browser, matching preview, and earlier application form.
- `assets/` holds the illustrations and storyboard images.
- `apps-script/`, `automation/`, and `tests/` hold the backend, workflow prototypes, and tests.

Open `index.html` to preview the site locally. Run `node --test` for the local checks. GitHub Pages publishes from the root of the `main` branch.
