# Sunrise Quest Board

External jump-out site for the Sunrise Operational comic:

https://sunrisecomics-jd2k6wxp.manus.space/

This prototype turns the September 26 Sunrise Fair volunteer system into a marketplace-style Quest Board. The main comic site stays unchanged; this repository hosts the recruiting, matching, and assignment layer that could open from the main site's top navigation.

## MVP Purpose

Project: Sunrise Fair Greenworker Quest System

Target event: September 26 Sunrise Fair

Product deadline: September 10, 2026

Readiness target: all recruited Greenworkers complete the quest guide/manual by September 20.

## Character Paths

- Power Runners: solar and technical support for energy distribution, battery checks, cable safety, and power stability.
- Green Workers: operations support for tents, physical infrastructure, logistics, site flow, and breakdown.
- Cloud Support: remote digital support for documentation, status updates, issue routing, and post-event proof collection.
- CE Vendors: market-table participants who need setup, power, attendance flow, support requests, and closing reports.
- Event Leads: coordination roles for crew training, shift changes, field decisions, and final event reporting.

## Visual Role Guide

The Power Runner path now includes a 15-beat storyboard gallery. Each beat pairs a role action with a visual panel so contributors can understand the day as a comic-style journey before they accept the quest.

## Marketplace Logic

The site adapts common service-marketplace patterns into a Sunrise-specific system:

- Fast quest posting instead of loose volunteer requests.
- Applicant comparison by fit, readiness, proof, and availability.
- Player Cards that package skills, badges, interests, and contribution history.
- Milestone-based completion with proof, feedback, credits, and badge progress.

## Reward Fields

- Quest Credits: internal contribution points for verified completed work.
- Stipend Eligible: roles that may qualify for compensation or program support after lead approval.
- Badge Progress: skill-growth tracking for role readiness, such as Solar 101, Site Safety, Crew Standup, or Documentation Support.

## Files

- `index.html`: page structure and content
- `styles.css`: visual design and responsive layout
- `script.js`: filtering, readiness level, quest publishing, applicant shortlisting, and Player Card interactions
- `assets/`: comic and supporting images
- `apps-script/`: Google Apps Script application, review, upload, withdrawal, and Player Card backend
- `tests/`: local fake-data backend and front-end contract tests

## Backend and privacy

Production Google Workspace ownership, authorization, deployment, and future automation connections must use `han@keytechlabs.org`.

The backend keeps full applications in Restricted Private Applications, sends only an allowlisted summary to Restricted Team Review, stores uploads in Restricted Drive folders, and creates an internal Player Card only after approval. Player Cards are non-public by default and require explicit applicant opt-in before public visibility. Google resource IDs stay in Apps Script Script Properties and must never be committed.

See [`apps-script/README.md`](apps-script/README.md) for schemas, setup, deployment, admin workflow, tests, and the manual access-control checklist.

## Publish on GitHub Pages

After local edits are committed in GitHub Desktop, click `Push origin`.

GitHub Pages is set to deploy from:

- Branch: `main`
- Folder: `/ (root)`

Public URL:

https://han567-b.github.io/sunrise-quest-board/
