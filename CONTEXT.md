# Splot

Splot is the ROPS Kraków social innovation hub: it connects people who describe a local problem with innovations, organisations and municipalities that already know a solution.

## Knowledge

**Innovation**:
A tested or developing social solution in the ROPS Social Innovation Library, with a stage (idea, pilot, deployed) and one or more challenge categories.
_Avoid_: Solution (in code), product, project

**Challenge category**:
One of the seven regional social challenges (aging, mental health, loneliness, digital exclusion, access to services, coordination, depopulation) used to classify innovations and submissions.
_Avoid_: Tag, topic

## Requests

**Submission**:
Something a resident, NGO or municipality sends to ROPS: a problem, an idea or a grant application. Identified by a case number like `SPL-2026-0142`.
_Avoid_: Ticket, request, need, zgłoszenie (in code)

**Idea card**:
An author's structured description of their own idea (what it is, the problem, who benefits, its stage), kept and edited by the author as a draft; sending it to ROPS for advice creates a submission of kind idea. UI label: „Fiszka”.
_Avoid_: Idea (for the record), draft, fiszka (in code)

**Grant call**:
A time-limited funding round run by ROPS, with its own application sections and eligibility criteria. UI label: „Nabór”.
_Avoid_: Competition, grant (for the round), nabór (in code)

**Grant application**:
An idea card turned into an application for one grant call; sending it creates a submission of kind application. UI label: „Wniosek”.
_Avoid_: Proposal, form, wniosek (in code)

**Social Innovation Canvas**:
The ROPS one-page frame for planning an innovation (problem, solution, resources, change, partners, outreach, audience, costs, success indicators, funding); in Splot it is filled from an idea card. UI label: „Kanwa Innowacji Społecznych”.
_Avoid_: Business model canvas, Canva, board

**Matchmaking**:
Finding innovations that fit a described problem and explaining why each one fits.
_Avoid_: Recommendation, search (in UI copy the word is never shown)

**Triage**:
Assigning a category, priority and possible duplicate to a new submission; AI suggests, ROPS confirms.
_Avoid_: Classification, moderation

## Collaboration

**Pilot**:
An organisation's participation in testing one innovation; a relation, not an account role.
_Avoid_: Tester (as a role), trial

**Thread**:
A conversation between a submission's author, ROPS staff and assigned experts.
_Avoid_: Chat, ticket conversation

**Innovation broker**:
The assistant that adapts an existing innovation to the service form and needs of a specific institution.
_Avoid_: Middleman, Pośrednik (in code)

**Tracking link**:
A link with a submission's case number and secret token that lets its author see the status and read the thread without an account.
_Avoid_: Status link, magic link

## AI

**AI hint**:
Any text written by AI and shown to a user, always marked as such and paired with a way to react. UI label: „Podpowiedź AI”.
_Avoid_: Recommendation, model output

**Skill**:
One conversational mode of the Splot agent (matchmaking, idea assistant, innovation broker), with its own prompt and tools.
_Avoid_: Bot, mode, sub-agent

**Conversation**:
One person's exchange with one Skill; it may lead to a submission, and ROPS then sees it alongside that submission.
_Avoid_: Chat, session, thread (a thread is between people)

## Accessibility

**Simple mode**:
A reader-chosen view with larger text, bigger controls and fewer elements per screen, guaranteed on the key paths (home, matchmaking, innovation card). UI label: „Prościej”.
_Avoid_: Easy mode, lite mode, senior mode

**Easy-read summary**:
A short plain-language version of an innovation's description, written by AI and marked as an AI hint.
_Avoid_: Simplified text, ETR (in code)
